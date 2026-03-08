import Stripe from "stripe";
import { headers } from "next/headers";
import { encrypt } from "../../lib/encryption";
import { NextResponse } from "next/server";
import clientPromise from "../Mongo-DB/mongodb";
import productDAO from "../Mongo-DB/dataaccessobject/productdao";
import orderDAO from "../Mongo-DB/dataaccessobject/orderdao";
// immport the send confimration email function
import { sendOrderConfirmation } from "../../lib/mailer";

export const runtime = "nodejs";

/**
 * This file is the Stripe webhook.
 *
 * A webhook is like a doorbell.
 * When something happens on Stripe's side
 * (like a payment succeeding), Stripe rings
 * our doorbell by sending a POST request here.
 *
 * We then:
 * 1. Check it is really Stripe ringing (signature check)
 * 2. Check we have not already answered this doorbell (idempotency)
 * 3. Create the order in MongoDB
 * 4. Reduce the stock of the purchased products
 *
 * IMPORTANT: Payment status and fulfillment status are two
 * separate things.
 *
 * paymentStatus  → Did the money move? (Stripe handles this)
 * fulfillmentStatus → Where is the physical item? (we handle this)
 *
 * When an order is first created:
 * paymentStatus   = "paid"     ← Stripe confirmed the money
 * fulfillmentStatus = "pending"  ← we have not shipped it yet
 *
 * These two fields update independently as the order progresses.
 */

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  // ----------------------------
  // 📨 STEP 1 — READ THE REQUEST
  // ----------------------------
  // We read the raw body as text, not JSON.
  // Stripe needs the raw body to verify the signature.
  // If we parse it as JSON first, the signature check fails.
  const body = await req.text();

  const headersList = await headers();
  const sig = headersList.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  // ----------------------------
  // 🔐 STEP 2 — VERIFY THE SIGNATURE
  // ----------------------------
  // This proves the request really came from Stripe.
  // Anyone could send a fake POST to this URL.
  // The signature check stops that.
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Webhook error" }, { status: 400 });
  }

  console.log("EVENT TYPE:", event.type);

  // ----------------------------
  // 🚨 STEP 3 — IGNORE NON-PAYMENT EVENTS
  // ----------------------------
  // Stripe sends many types of events (refunds, disputes, etc).
  // We only care about successful payments.
  // Everything else gets a polite "received" and is ignored.
  if (event.type !== "payment_intent.succeeded") {
    return NextResponse.json({ received: true });
  }

  const paymentIntent = event.data.object as Stripe.PaymentIntent;

  // ----------------------------
  // 📧 STEP 4 — GET CUSTOMER EMAIL
  // ----------------------------
  // We try to get the email from two places:
  // 1. receipt_email — set by Stripe if the customer entered it
  // 2. metadata.email — set by us when creating the PaymentIntent
  const email =
    paymentIntent.receipt_email || paymentIntent.metadata?.email || null;

  if (!email) {
    throw new Error("Missing customer email");
  }

  // ----------------------------
  // 🔒 STEP 5 — IDEMPOTENCY CHECK
  // ----------------------------
  // Stripe can send the same webhook more than once.
  // For example: if our server was slow to respond,
  // Stripe retries. Without this check, we would
  // create duplicate orders.
  // We check if an order with this PaymentIntent ID
  // already exists. If it does, we stop here.
  const existingOrder = await orderDAO.findByPaymentIntent(paymentIntent.id);

  if (existingOrder) {
    console.log("Order already processed. Skipping.");
    return NextResponse.json({ received: true });
  }

  // ----------------------------
  // 📦 STEP 6 — GET SHIPPING + CART
  // ----------------------------
  const shipping = paymentIntent.shipping;

  console.log("METADATA:", paymentIntent.metadata);

  // The cart was attached to the PaymentIntent as metadata
  // when the customer checked out. If it is missing,
  // this is not a shop order — ignore it.
  if (!paymentIntent.metadata?.cart) {
    console.log("No cart metadata found — ignoring event.");
    return NextResponse.json({ received: true });
  }

  const cart = JSON.parse(paymentIntent.metadata.cart);

  // ----------------------------
  // 💾 STEP 7 — CREATE ORDER IN MONGODB
  // ----------------------------
  // We use a MongoDB transaction here.
  // A transaction means: do ALL of these things,
  // or do NONE of them.
  //
  // If stock reduction succeeds but order creation fails,
  // the transaction rolls everything back automatically.
  // This prevents ghost orders or overselling.
  const client = await clientPromise;
  const session = client.startSession();

try {
    //  Declared OUTSIDE the transaction so they are
    // visible to sendOrderConfirmation after it commits
    let total = 0;
    const orderItems: any[] = [];

    await session.withTransaction(async () => {
      const productIds = cart.map((item: any) => item._id);
      const products = await productDAO.getByIds(productIds);

      for (const item of cart) {
        const product = products.find(
          (p: any) => p._id.toString() === item._id,
        );

        if (!product) throw new Error("Product not found");

        const updateResult = await productDAO.atomicDecreaseStock(
          product._id.toString(),
          item.quantity,
          session,
        );

        if (!updateResult) throw new Error("Insufficient stock");

        total += product.price * item.quantity;

        orderItems.push({
          productId: product._id,
          title: product.name,
          price: product.price,
          quantity: item.quantity,
        });
      }

   await orderDAO.createOrder(
        {
          stripePaymentIntentId: paymentIntent.id,
          items: orderItems,
          total,
          paymentStatus: "paid",
          fulfillmentStatus: "pending",
          createdAt: new Date(),

          // ✅ PII fields encrypted before saving
          // Even if the database is breached these
          // fields are unreadable without ENCRYPTION_KEY
          email: encrypt(email),
          shippingName: encrypt(shipping?.name || ""),
          shippingAddress: encrypt(JSON.stringify(shipping?.address || {})),
        },
        session,
      );
    });

    // ✅ total and orderItems are now in scope here
    await sendOrderConfirmation({
      to: email,
      orderTotal: total,
      items: orderItems,
      shippingName: shipping?.name || "Customer",
    });

    console.log("Order created successfully (transaction committed)");

  } catch (err) {
    console.error("Transaction failed:", err);
    return NextResponse.json(
      { error: "Order processing failed" },
      { status: 500 },
    );
  } finally {
    await session.endSession();
  }
    return NextResponse.json({ received: true });

}

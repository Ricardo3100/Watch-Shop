import Stripe from "stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import clientPromise from "../Mongo-DB/mongodb";
import productDAO from "../Mongo-DB/dataaccessobject/productdao";
import orderDAO from "../Mongo-DB/dataaccessobject/orderdao";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const body = await req.text();

  const headersList = await headers();
  const sig = headersList.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

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

  // 🚨 Ignore everything except successful payments
  if (event.type !== "payment_intent.succeeded") {
    return NextResponse.json({ received: true });
  }

  const paymentIntent = event.data.object as Stripe.PaymentIntent;

  // ----------------------------
  // 🔒 IDEMPOTENCY CHECK
  // ----------------------------
  const existingOrder = await orderDAO.findByPaymentIntent(paymentIntent.id);

  if (existingOrder) {
    console.log("Order already processed. Skipping.");
    return NextResponse.json({ received: true });
  }

  const shipping = paymentIntent.shipping;

  // if (!paymentIntent.metadata?.cart) {
  //   console.error("Missing cart metadata");
  //   return NextResponse.json(
  //     { error: "Missing cart metadata" },
  //     { status: 400 },
  //   );
  // }

  // 
console.log("METADATA:", paymentIntent.metadata);

if (!paymentIntent.metadata?.cart) {
  console.log("No cart metadata found — ignoring event.");
  return NextResponse.json({ received: true });
}

const cart = JSON.parse(paymentIntent.metadata.cart);
  const client = await clientPromise;
  const session = client.startSession();

  try {
    await session.withTransaction(async () => {
      const productIds = cart.map((item: any) => item._id);

      const products = await productDAO.getByIds(productIds);

      let total = 0;
      const orderItems = [];

      for (const item of cart) {
        const product = products.find(
          (p: any) => p._id.toString() === item._id,
        );

        if (!product) {
          throw new Error("Product not found");
        }

        const updateResult = await productDAO.atomicDecreaseStock(
          product._id.toString(),
          item.quantity,
          session,
        );

        if (!updateResult) {
          throw new Error("Insufficient stock");
        }

        total += product.price * item.quantity;
// we build an array of order items
//  that will be stored in the order document.
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
          shipping,
          total,
          status: "paid",
          createdAt: new Date(),
        },
        session,
      );
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

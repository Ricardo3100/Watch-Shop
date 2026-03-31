import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { verifyAdminApi } from "../../lib/verifyadmin";
import OrderDAO from "../../api/Mongo-DB/dataaccessobject/orderdao";
import { safeDecrypt } from "../../lib/encryption";
import { sendRefundConfirmationEmail } from "../../lib/mailer";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(
  req: NextRequest,
  // Context params is a Promise because of Next.js dynamic 
  // route handling in server components
  context: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await context.params;

  const adminCheck = await verifyAdminApi();
  if (!adminCheck.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { action } = await req.json();

    if (action !== "approved" && action !== "rejected") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // ✅ use orderId (not params.orderId anymore)
    const order = await OrderDAO.findById(orderId);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.refundStatus !== "requested") {
      return NextResponse.json(
        { error: "Order is not in a refundable state" },
        { status: 409 },
      );
    }

    if (action === "approved") {
      await stripe.refunds.create({
        payment_intent: order.stripePaymentIntentId,
      });

      const customerEmail = safeDecrypt(order.email);
      const customerName = safeDecrypt(order.shippingName) || "Customer";

      if (customerEmail) {
        await sendRefundConfirmationEmail({
          to: customerEmail,
          shippingName: customerName,
          orderTotal: order.total,
        });
      }
    }

    await OrderDAO.updateRefundStatus(orderId, action);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Refund action error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { verifyAdminApi } from "../../../../lib/verifyadmin";
import OrderDAO from "../../../../api/Mongo-DB/dataaccessobject/orderdao";
import { safeDecrypt } from "../../../../lib/encryption";
import { sendRefundConfirmationEmail } from "../../../../lib/mailer";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }, // ← Promise type
) 
{
  const adminCheck = await verifyAdminApi();
  // If it returned a NextResponse, it means auth failed — return it directly
  if (adminCheck instanceof NextResponse) {
    return adminCheck;
  }
    const { orderId } = await params;  // ← await it


  try {

    const { action } = await req.json();

    if (action !== "approved" && action !== "rejected") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // ✅ Fetch order FIRST before using it
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

    // ✅ Only one approved block, after order is fetched
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

       // Delete order from MongoDB after approval
       if (action === "approved") {
         await OrderDAO.deleteOrder(orderId);
       }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Refund action error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

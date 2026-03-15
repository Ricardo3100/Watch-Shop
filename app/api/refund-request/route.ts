import { NextRequest, NextResponse } from "next/server";
import OrderDAO from "../../api/Mongo-DB/dataaccessobject/orderdao";

export async function POST(req: NextRequest) {
  try {
    const { orderId, token, reason, note } = await req.json();

    if (!orderId || !token || !reason) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Validate token matches order
    const order = await OrderDAO.findByRefundToken(token);

    if (!order || order._id.toString() !== orderId) {
      return NextResponse.json(
        { error: "Invalid or expired refund link" },
        { status: 403 },
      );
    }

    // Guard against duplicate submissions
    if (order.refundStatus !== "none") {
      return NextResponse.json(
        { error: "A refund request has already been submitted for this order" },
        { status: 409 },
      );
    }

    await OrderDAO.updateRefundStatus(orderId, "requested", reason, note);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Refund request error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

import { verifyAdminApi } from "../../../lib/verifyadmin";
import { NextResponse } from "next/server";
import OrderDAO from "../../Mongo-DB/dataaccessobject/orderdao";

export async function GET() {
  const auth = await verifyAdminApi();

  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const orders = await OrderDAO.getCompletedOrders();

    return NextResponse.json({ orders });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to retrieve orders" },
      { status: 500 },
    );
  }
}

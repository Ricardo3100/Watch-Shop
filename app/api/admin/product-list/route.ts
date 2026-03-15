export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { verifyAdminApi } from "../../../lib/verifyadmin";
import ProductDAO from "../../Mongo-DB/dataaccessobject/productdao";

export async function GET() {
  const auth = await verifyAdminApi();
  if (auth instanceof NextResponse) return auth;

  try {
    const products = await ProductDAO.getAll();
    return NextResponse.json({ products });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load products" },
      { status: 500 },
    );
  }
}

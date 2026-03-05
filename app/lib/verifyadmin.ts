// lib/verifyAdmin.ts

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

type AdminToken = {
  adminId: string;
  name: string; 

  role: string;
};

//
// 🔐 For Server Components (Dashboard Pages)
//
export async function verifyAdminPage(): Promise<AdminToken> {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;

  if (!token) {
    redirect("/admin/login");
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.ADMIN_JWT_SECRET!,
    ) as AdminToken;

    if (decoded.role !== "admin") {
      redirect("/admin/login");
    }

    return decoded;
  } catch {
    redirect("/admin/login");
  }
}

//
// 🔐 For API Routes (Backend)
// Returns JSON instead of redirecting
//
export async function verifyAdminApi(): Promise<AdminToken | NextResponse> {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const decoded = jwt.verify(
      token,
      
      process.env.ADMIN_JWT_SECRET!,
    ) as AdminToken;

    if (decoded.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return decoded;
  } catch {
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 401 },
    );
  }
}

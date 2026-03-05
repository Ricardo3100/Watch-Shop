import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import AdminLoginClient from "./AdminLoginClient";
// next js 14 + requires cookies to be 
// read in server components, so we check 
// for token here and redirect if valid
// also cookie is an acync so it requires await, and 
// we need to verify the token before redirecting
export default async function LoginPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;

  if (token) {
    try {
      jwt.verify(token, process.env.ADMIN_JWT_SECRET!);
      redirect("/admin/dashboard");
    } catch {
      // Invalid token → allow login page
    }
  }

  return <AdminLoginClient />;
}

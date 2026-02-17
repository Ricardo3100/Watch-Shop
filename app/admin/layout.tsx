import { redirect } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAdmin = process.env.ADMIN_SECRET === "true";

  if (!isAdmin) {
    redirect("/");
  }

  return <>{children}</>;
}

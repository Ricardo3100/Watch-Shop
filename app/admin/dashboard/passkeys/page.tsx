import { verifyAdminPage } from "../../../lib/verifyadmin";
import PasskeysClient from "./PasskeysClient";

export default async function PasskeysPage() {
  await verifyAdminPage();
  return <PasskeysClient />;
}

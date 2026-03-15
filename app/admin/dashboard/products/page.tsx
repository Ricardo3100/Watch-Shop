import { verifyAdminPage } from "../../../lib/verifyadmin";
import ProductsClient from "./productclient";

export default async function ProductsPage() {
  // This runs on the server before anything reaches the browser.
  // If the JWT is missing or invalid, verifyAdminPage redirects
  // to /admin/login and ProductsClient never loads.
  await verifyAdminPage();
  return <ProductsClient />;
}

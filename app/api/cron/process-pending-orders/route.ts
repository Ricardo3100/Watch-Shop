export const runtime = "nodejs";

import { NextResponse } from "next/server";
import OrderDAO from "../../Mongo-DB/dataaccessobject/orderdao";
import { safeDecrypt } from "../../../lib/encryption";
import { sendDemoCompletionEmail } from "../../../lib/mailer"; // ✅ uncommented

/**
 * GET /api/cron/process-pending-orders
 *
 * This route is called automatically by Vercel Cron
 * once a day at 9am UTC — not by the admin or customer.
 *
 * It finds any orders where:
 * - fulfillmentStatus is still "pending"
 * - createdAt is older than 24 hours
 * - The admin never manually clicked the ship button
 *
 * For each one it:
 * 1. Decrypts the PII fields from the order document
 * 2. Sends the demo completion email to the customer
 * 3. Deletes the full order record from MongoDB
 *
 * After this runs nothing remains in MongoDB
 * for any order older than 24 hours.
 *
 * The CRON_SECRET protects this route so only
 * Vercel can call it — not random people who find the URL.
 */
export async function GET(req: Request) {
  // ----------------------------
  // 🔐 SECURITY CHECK
  // ----------------------------
  // Vercel sends CRON_SECRET in the Authorization header.
  // Without this anyone could hit this URL and trigger
  // emails and deletion.
  const authHeader = req.headers.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.error("Cron job unauthorized request blocked");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // ----------------------------
    // 🔍 FIND EXPIRED ORDERS
    // ----------------------------
    // Query the orders collection directly —
    // we no longer use a separate order_pii collection.
    // We look for orders that:
    // - Are older than 24 hours
    // - Still have fulfillmentStatus: "pending"
    //   (admin never clicked the ship button)
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // ✅ method name was missing
    const expiredOrders = await OrderDAO.getExpiredPendingOrders(cutoff);

    console.log(
      `Cron job found ${expiredOrders.length} expired pending orders`,
    );

    if (expiredOrders.length === 0) {
      return NextResponse.json({ processed: 0 });
    }

    let processed = 0;
    let failed = 0;

    for (const order of expiredOrders) {
      try {
        // ----------------------------
        // 🔓 DECRYPT PII FOR EMAIL
        // ----------------------------
        // PII was encrypted when the order was created.
        // We decrypt here just to send the email —
        // the decrypted values only exist in memory.
        const customerEmail = safeDecrypt(order.email);
        const shippingName = safeDecrypt(order.shippingName) || "Customer";

        // Get tracking number from the order document
        // It may or may not exist depending on whether
        // FedEx was ever called for this order
        const trackingNumber = order.shipping?.tracking_number;

        // ----------------------------
        // 📧 SEND DEMO COMPLETION EMAIL
        // ----------------------------
        // Only send if we have both an email address
        // and a tracking number. If FedEx was never called
        // there is no tracking number — skip the email
        // but still delete the order.
        if (customerEmail && trackingNumber) {
          await sendDemoCompletionEmail({
            // ✅ restored
            to: customerEmail,
            trackingNumber,
            shippingName,
          });
        } else {
          console.log(
            `Order ${order._id} missing email or tracking number — skipping email`,
          );
        }

        // ----------------------------
        // 🗑️ DELETE FULL ORDER
        // ----------------------------
        // Delete the order regardless of whether
        // the email was sent — the 24 hour window
        // has passed and all data must be removed.
        await OrderDAO.deleteOrder(order._id.toString());

        processed++;
        console.log(`Processed and deleted order: ${order._id}`);
      } catch (err) {
        // Log individual failures but keep going
        // so one bad order does not block the rest
        failed++;
        console.error(`Failed to process order ${order._id}:`, err);
      }
    }

    console.log(`Cron complete — processed: ${processed}, failed: ${failed}`);

    return NextResponse.json({ processed, failed });
  } catch (err) {
    console.error("Cron job error:", err);
    return NextResponse.json({ error: "Cron job failed" }, { status: 500 });
  }
}

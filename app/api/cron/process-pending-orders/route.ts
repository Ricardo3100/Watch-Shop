export const runtime = "nodejs";

import { NextResponse } from "next/server";
import OrderDAO from "../../Mongo-DB/dataaccessobject/orderdao";
import { safeDecrypt, decrypt } from "../../../lib/encryption";
import {
  sendDemoCompletionEmail,
  sendShippingNotification,
} from "../../../lib/mailer";
import { getFedExToken } from "../../../lib/fedex";

/**
 * GET /api/cron/process-pending-orders
 *
 * Runs once a day at 9am UTC via Vercel Cron.
 *
 * This route does two jobs in one pass:
 *
 * JOB 1 — AUTO-SHIP
 * Finds orders older than 12 hours with no tracking number.
 * Calls FedEx sandbox to generate a tracking number.
 * Saves tracking number to MongoDB.
 * Sends shipping notification email to customer.
 *
 * JOB 2 — AUTO-DELETE
 * Finds orders older than 24 hours.
 * Sends demo completion email to customer.
 * Deletes the full order record from MongoDB.
 *
 * This means the demo runs completely hands-off after deployment.
 * No admin interaction required for any order.
 */

const SUPPORTED_COUNTRIES = [
  "US",
  "CA",
  "GB",
  "AU",
  "DE",
  "FR",
  "JP",
  "MX",
  "NL",
  "IT",
];

const SHIPPER_ADDRESS = {
  streetLines: ["123 Your Street"],
  city: "Your City",
  stateOrProvinceCode: "CA",
  postalCode: "90210",
  countryCode: "US",
};

export async function GET(req: Request) {
  // ----------------------------
  // 🔐 SECURITY CHECK
  // ----------------------------
  const authHeader = req.headers.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.error("Cron job unauthorized request blocked");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = Date.now();
  const twelveHourCutoff = new Date(now - 12 * 60 * 60 * 1000);
  const twentyFourHourCutoff = new Date(now - 24 * 60 * 60 * 1000);

  let autoShipped = 0;
  let autoDeleted = 0;
  let failed = 0;

  try {
    // ----------------------------
    // 🚚 JOB 1 — AUTO-SHIP
    // ----------------------------
    // Find orders older than 12 hours with no tracking number yet.
    // The admin never clicked ship — so we do it automatically.
    const unshippedOrders =
      await OrderDAO.getOrdersNeedingAutoShip(twelveHourCutoff);

    console.log(
      `Auto-ship: found ${unshippedOrders.length} orders needing shipment`,
    );

    for (const order of unshippedOrders) {
      try {
        // Decrypt PII to build the FedEx payload
        let shippingName: string;
        let shippingAddress: any;
        let customerEmail: string;

        try {
          shippingName = decrypt(order.shippingName) || "Customer";
          shippingAddress = JSON.parse(decrypt(order.shippingAddress));
          customerEmail = decrypt(order.email);
        } catch (err) {
          console.error(`Failed to decrypt PII for order ${order._id}:`, err);
          failed++;
          continue;
        }

        // Validate country before calling FedEx
        if (!SUPPORTED_COUNTRIES.includes(shippingAddress?.country)) {
          console.log(
            `Order ${order._id} — country ${shippingAddress?.country} not supported, skipping FedEx`,
          );
          failed++;
          continue;
        }

        // Get FedEx token
        const token = await getFedExToken();

        // Build FedEx payload
        const shipmentPayload = {
          labelResponseOptions: "URL_ONLY",
          requestedShipment: {
            labelSpecification: {
              labelFormatType: "COMMON2D",
              imageType: "PDF",
              labelStockType: "PAPER_85X11_TOP_HALF_LABEL",
            },
            shipper: {
              contact: {
                personName: "Watch Shop Admin",
                phoneNumber: "1234567890",
              },
              address: SHIPPER_ADDRESS,
            },
            recipients: [
              {
                contact: {
                  personName: shippingName,
                  phoneNumber: "0000000000",
                },
                address: {
                  streetLines: [
                    shippingAddress.line1,
                    shippingAddress.line2 || "",
                  ].filter(Boolean),
                  city: shippingAddress.city,
                  stateOrProvinceCode: shippingAddress.state?.trim() || "CA",
                  postalCode: shippingAddress.postal_code,
                  countryCode: shippingAddress.country,
                },
              },
            ],
            shipDatestamp: new Date().toISOString().split("T")[0],
            serviceType: "FEDEX_GROUND",
            packagingType: "YOUR_PACKAGING",
            pickupType: "USE_SCHEDULED_PICKUP",
            shippingChargesPayment: {
              paymentType: "SENDER",
              payor: {
                responsibleParty: {
                  accountNumber: { value: process.env.FEDEX_ACCOUNT_NUMBER! },
                },
              },
            },
            requestedPackageLineItems: [
              { weight: { units: "LB", value: "1" } },
            ],
          },
          accountNumber: { value: process.env.FEDEX_ACCOUNT_NUMBER! },
        };

        // Call FedEx
        const fedexRes = await fetch(
          `${process.env.FEDEX_API_URL}/ship/v1/shipments`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
              "X-locale": "en_US",
            },
            body: JSON.stringify(shipmentPayload),
          },
        );

        const fedexData = await fedexRes.json();

        if (!fedexRes.ok) {
          console.error(`FedEx failed for order ${order._id}:`, fedexData);
          failed++;
          continue;
        }

        const trackingNumber =
          fedexData?.output?.transactionShipments?.[0]?.masterTrackingNumber;

        if (!trackingNumber) {
          console.error(`No tracking number returned for order ${order._id}`);
          failed++;
          continue;
        }

        // Save tracking number to MongoDB
        await OrderDAO.updateShipment(order._id.toString(), trackingNumber);

        // Send shipping notification email
        await sendShippingNotification({
          to: customerEmail,
          trackingNumber,
          shippingName,
        });

        autoShipped++;
        console.log(
          `Auto-shipped order ${order._id} — tracking: ${trackingNumber}`,
        );
      } catch (err) {
        failed++;
        console.error(`Auto-ship failed for order ${order._id}:`, err);
      }
    }

    // ----------------------------
    // 🗑️ JOB 2 — AUTO-DELETE
    // ----------------------------
    // Find all orders older than 24 hours.
    // Send demo completion email then delete everything.
    const expiredOrders =
      await OrderDAO.getExpiredPendingOrders(twentyFourHourCutoff);

    console.log(`Auto-delete: found ${expiredOrders.length} expired orders`);

    for (const order of expiredOrders) {
      try {
        const customerEmail = safeDecrypt(order.email);
        const shippingName = safeDecrypt(order.shippingName) || "Customer";
        const trackingNumber = order.trackingNumber || null;

        // Send demo completion email if we have what we need
        if (customerEmail && trackingNumber) {
          await sendDemoCompletionEmail({
            to: customerEmail,
            trackingNumber,
            shippingName,
          });
        } else {
          console.log(
            `Order ${order._id} missing email or tracking number — skipping completion email`,
          );
        }

        // Delete full order regardless
        await OrderDAO.deleteOrder(order._id.toString());

        autoDeleted++;
        console.log(`Auto-deleted order ${order._id}`);
      } catch (err) {
        failed++;
        console.error(`Auto-delete failed for order ${order._id}:`, err);
      }
    }

    console.log(
      `Cron complete — auto-shipped: ${autoShipped}, auto-deleted: ${autoDeleted}, failed: ${failed}`,
    );

    return NextResponse.json({ autoShipped, autoDeleted, failed });
  } catch (err) {
    console.error("Cron job error:", err);
    return NextResponse.json({ error: "Cron job failed" }, { status: 500 });
  }
}

export const runtime = "nodejs";
import { sendShippingNotification } from "../../../lib/mailer";
import { NextResponse } from "next/server";
import { verifyAdminApi } from "../../../lib/verifyadmin";
import { getFedExToken } from "../../../lib/fedex";
import OrderDAO from "../../Mongo-DB/dataaccessobject/orderdao";
import { safeDecrypt } from "../../../lib/encryption";
// import the encryption file here so we can 
// decrypt the FedEx credentials before using 
// them in the API call
import { decrypt } from "../../../lib/encryption";

/**
 * POST /api/admin/fedex-shipment
 *
 * What this route does:
 * 1. Verifies the admin is logged in
 * 2. Finds the order in MongoDB by ID
 * 3. Validates the recipient country is supported
 * 4. Gets a FedEx auth token
 * 5. Sends the shipment request to FedEx sandbox
 * 6. Extracts the tracking number from the response
 * 7. Saves the tracking number to MongoDB
 * 8. Updates the order fulfillmentStatus to "shipped"
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

export async function POST(req: Request) {
  // Step 1 — verify admin is logged in
  const auth = await verifyAdminApi();
  if (auth instanceof NextResponse) return auth;

  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 },
      );
    }

    // Step 2 — fetch the order from MongoDB
    // Step 2 — fetch the order from MongoDB
    const order = await OrderDAO.findById(orderId);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Step 3 — decrypt PII fields
    // PII was encrypted when the order was created
    // in the Stripe webhook using AES-256-GCM.
    // We decrypt here so we can use the values for
    // the FedEx request and the shipping email.
    // The decrypted values only exist in memory —
    // they are never written back to the database.
    // The entire order is deleted after the email fires.
    let shippingName: string;
    let shippingAddress: any;
    let customerEmail: string;

    try {
      shippingName = decrypt(order.shippingName) || "Customer";
      shippingAddress = JSON.parse(decrypt(order.shippingAddress));
      customerEmail = decrypt(order.email);
    } catch (err) {
      console.error("Failed to decrypt order PII:", err);
      return NextResponse.json(
        { error: "Failed to read order details" },
        { status: 500 },
      );
    }

    if (!shippingAddress) {
      return NextResponse.json(
        { error: "Order has no shipping address" },
        { status: 400 },
      );
    }

    // Step 4 — validate the recipient country
    // FedEx sandbox only supports certain country codes.
    // We catch this early so the admin gets a clear message
    // instead of a cryptic FedEx error.
    const recipientCountry = shippingAddress?.country; // ✅ from decrypted address

    if (!recipientCountry || !SUPPORTED_COUNTRIES.includes(recipientCountry)) {
      return NextResponse.json(
        {
          error: `Shipping to "${recipientCountry}" is not currently supported. Supported countries: ${SUPPORTED_COUNTRIES.join(", ")}`,
        },
        { status: 400 },
      );
    }

    // Step 5 — get FedEx OAuth token
    // This is a short-lived token — we get a fresh one each request
    const token = await getFedExToken();
    // Step 6 — build the shipment request payload
    // Step 5 — build the shipment request payload
    // Recipients use decrypted PII values from Step 3
    // The shipper block uses your business address —
    // replace with your real address for production
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
          address: {
            // Your address as the sender
            // Replace with your real business address for production
            streetLines: ["123 Your Street"],
            city: "Your City",
            stateOrProvinceCode: "CA",
            postalCode: "90210",
            countryCode: "US",
          },
        },
        recipients: [
          {
            contact: {
              personName: shippingName, // ✅ decrypted
              phoneNumber: "0000000000",
            },
            address: {
              streetLines: [
                shippingAddress.line1, // ✅ decrypted
                shippingAddress.line2 || "",
              ].filter(Boolean),
              city: shippingAddress.city, // ✅ decrypted
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
              accountNumber: {
                value: process.env.FEDEX_ACCOUNT_NUMBER!,
              },
            },
          },
        },
        requestedPackageLineItems: [
          {
            weight: {
              units: "LB",
              value: "1",
            },
          },
        ],
      },
      accountNumber: {
        value: process.env.FEDEX_ACCOUNT_NUMBER!,
      },
    };

    // Step 6 — call FedEx Ship API
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
    // Step 7 — extract tracking number
    // Declared only once — the duplicate was causing the 500 error
    const trackingNumber =
      fedexData?.output?.transactionShipments?.[0]?.masterTrackingNumber;

    console.log("Tracking number extracted:", trackingNumber);

    if (!trackingNumber) {
      console.error("No tracking number in FedEx response:", fedexData);
      return NextResponse.json(
        { error: "FedEx did not return a tracking number" },
        { status: 500 },
      );
    }

    // Step 8 — save tracking number to MongoDB
    // This also updates fulfillmentStatus to "shipped"
    // so the order disappears from the pending shipping queue
    try {
      await OrderDAO.updateShipment(orderId, trackingNumber);
      console.log("MongoDB updated successfully");
    } catch (dbErr) {
      console.error("MongoDB update failed:", dbErr);
      return NextResponse.json(
        { error: "Shipment created but failed to save tracking number" },
        { status: 500 },
      );
    }

    // Step 9 — send shipping notification email to customer
    // We use the decrypted values from Step 3 —
    // they are still in memory at this point.
    // We do NOT read from the database again because
    // the PII is about to be deleted.
    await sendShippingNotification({
      to: customerEmail, // ✅ decrypted in Step 3
      trackingNumber,
      shippingName, // ✅ decrypted in Step 3
    });

    // Step 10 — delete the full order record
    // This is the manual shipping path.
    // The cron job handles the case where admin
    // never clicks the ship button within 24 hours.
    // After this line nothing remains in MongoDB
    // for this order — PII and all.
    await OrderDAO.deleteOrder(orderId);
    console.log("Full order deleted after shipping email sent");

    return NextResponse.json({
      success: true,
      trackingNumber,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
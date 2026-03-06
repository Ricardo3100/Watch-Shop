export const runtime = "nodejs";
import { sendShippingNotification } from "../../../lib/mailer";
import { NextResponse } from "next/server";
import { verifyAdminApi } from "../../../lib/verifyadmin";
import { getFedExToken } from "../../../lib/fedex";
import OrderDAO from "../../Mongo-DB/dataaccessobject/orderdao";

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
    const order = await OrderDAO.findById(orderId);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (!order.shipping?.address) {
      return NextResponse.json(
        { error: "Order has no shipping address" },
        { status: 400 },
      );
    }

    // Step 3 — validate the recipient country
    // FedEx sandbox only supports certain country codes.
    // We catch this early so the admin gets a clear message
    // instead of a cryptic FedEx error.
    const recipientCountry = order.shipping?.address?.country;

    if (!recipientCountry || !SUPPORTED_COUNTRIES.includes(recipientCountry)) {
      return NextResponse.json(
        {
          error: `Shipping to "${recipientCountry}" is not currently supported. Supported countries: ${SUPPORTED_COUNTRIES.join(", ")}`,
        },
        { status: 400 },
      );
    }

    // Step 4 — get FedEx OAuth token
    // This is a short-lived token — we get a fresh one each request
    const token = await getFedExToken();

    // Step 5 — build the shipment request payload
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
              personName: order.shipping.name || "Customer",
              phoneNumber: order.shipping.phone || "0000000000",
            },
            address: {
              streetLines: [
                order.shipping.address.line1,
                order.shipping.address.line2 || "",
              ].filter(Boolean),
              city: order.shipping.address.city,
              stateOrProvinceCode: order.shipping.address.state?.trim() || "CA",
              postalCode: order.shipping.address.postal_code,
              countryCode: order.shipping.address.country,
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

    const fedexData = await fedexRes.json();

    console.log("FedEx response:", JSON.stringify(fedexData, null, 2));

    if (!fedexRes.ok) {
      console.error("FedEx shipment failed:", fedexData);
      return NextResponse.json(
        { error: "FedEx shipment creation failed", details: fedexData },
        { status: 500 },
      );
    }

    // Step 7 — extract tracking number
    // ✅ declared only once — the duplicate was causing the 500 error
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
    // Step 8 — save tracking number to MongoDB
    try {
      await OrderDAO.updateShipment(orderId, trackingNumber);
      console.log("MongoDB updated successfully");

      // ✅ Step 9 — send shipping notification email to customer
      // We have everything we need at this point:
      // - order.email → who to send to
      // - trackingNumber → just returned by FedEx
      // - order.shipping.name → customer name for the greeting
      await sendShippingNotification({
        to: order.email,
        trackingNumber,
        shippingName: order.shipping?.name || "Customer",
      });
    } catch (dbErr) {
      console.error("MongoDB update failed:", dbErr);
      return NextResponse.json(
        { error: "Shipment created but failed to save tracking number" },
        { status: 500 },
      );
    }

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

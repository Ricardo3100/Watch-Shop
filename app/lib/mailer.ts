/**
 * lib/mailer.ts
 *
 * This file does one job:
 * Send emails via Brevo (formerly Sendinblue).
 *
 * Think of it like a post office worker.
 * You hand them a letter (the email details)
 * and they handle getting it delivered.
 *
 * Two functions are exported:
 * 1. sendOrderConfirmation → sent to customer after payment
 * 2. sendShippingNotification → sent to customer when shipped
 *
 * Both are called from server-side code only.
 * Your API key never touches the browser.
 */

import {
  TransactionalEmailsApi,
  TransactionalEmailsApiApiKeys,
  SendSmtpEmail,
} from "@getbrevo/brevo";

// ----------------------------
// 📮 THE POST OFFICE (Brevo API client)
// ----------------------------
// We create this once and reuse it for every email.
const sendSmtpEmail = new SendSmtpEmail();
    // Set the API key for authentication
const apiInstance = new TransactionalEmailsApi();

apiInstance.setApiKey(
  TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY!,
);
//  This is the email address and name that will appear
//  in the "From" field of the email
const FROM_EMAIL = process.env.BREVO_FROM_EMAIL!;
const FROM_NAME = process.env.BREVO_FROM_NAME || "Watch Shop";

// ----------------------------
// 📧 EMAIL 1 — ORDER CONFIRMATION
// ----------------------------
// Sent to the customer immediately after payment succeeds.
// Called from the Stripe webhook after createOrder().
export async function sendOrderConfirmation({
  // The following is the information we need to include in the email.

  to,
  orderTotal,
  items,
  shippingName,
  orderId,
  refundToken,
}: {
  to: string;
  orderTotal: number;
  items: { title: string; quantity: number; price: number }[];
  shippingName: string;
  orderId: string;
  refundToken: string;
}) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const refundUrl = `${baseUrl}/refund-request?token=${refundToken}&order=${orderId}`;

  const itemRows = items
    .map(
      (item) => `
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
          ${item.title} × ${item.quantity}
        </td>
        <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; text-align: right;">
          $${(item.price * item.quantity).toFixed(2)}
        </td>
      </tr>
    `,
    )
    .join("");

  const sendSmtpEmail = new SendSmtpEmail();

  sendSmtpEmail.sender = { name: FROM_NAME, email: FROM_EMAIL };
  sendSmtpEmail.to = [{ email: to, name: shippingName }];
  sendSmtpEmail.subject = "Your Watch Shop order has been received";
  sendSmtpEmail.htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">

      <!-- Logo -->
      <div style="margin-bottom: 32px;">
        <img 
          src="${baseUrl}/envisioningsolutionslogo.png" 
          alt="Watch Shop" 
          style="height: 48px; width: auto;"
        />
      </div>

      <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 8px;">
        Your order has been received ✅
      </h1>
      
      <p style="color: #666; margin-bottom: 32px;">
        Hi ${shippingName}, thank you for your purchase.
        We have received your order and are preparing it for shipment.
        You will receive another email with your tracking number once it ships.
      </p>

      <h2 style="font-size: 16px; font-weight: bold; margin-bottom: 16px;">
        What you ordered
      </h2>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        ${itemRows}
        <tr>
          <td style="padding: 12px 0; font-weight: bold;">
            Total charged
          </td>
          <td style="padding: 12px 0; font-weight: bold; text-align: right;">
            $${orderTotal.toFixed(2)}
          </td>
        </tr>
      </table>

      <p style="color: #999; font-size: 13px; margin-bottom: 8px;">
        If you have any questions about your order please reply to this email.
      </p>

      <!-- Refund request link -->
      <p style="color: #999; font-size: 13px;">
        Not happy with your order?
        <a href="${refundUrl}" style="color: #666;">Request a refund</a>
      </p>

    </div>
  `;

  await apiInstance.sendTransacEmail(sendSmtpEmail);
  console.log(`Order confirmation sent to ${to}`);
}

// ----------------------------
// 📦 EMAIL 2 — SHIPPING NOTIFICATION
// ----------------------------
// Sent to the customer when the admin clicks
// "Create FedEx Shipment for This Order".
// Called from the FedEx shipment route after
// OrderDAO.updateShipment() succeeds.
export async function sendShippingNotification({
  to,
  trackingNumber,
  shippingName,
}: {
  to: string;
  trackingNumber: string;
  shippingName: string;
}) {
  const trackingUrl = `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`;

const sendSmtpEmail = new SendSmtpEmail();

  sendSmtpEmail.sender = { name: FROM_NAME, email: FROM_EMAIL };
  sendSmtpEmail.to = [{ email: to, name: shippingName }];
  sendSmtpEmail.subject = "Your Watch Shop order has shipped";
  sendSmtpEmail.htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
      
      <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 8px;">
        Your order is on its way 📦
      </h1>

      <p style="color: #666; margin-bottom: 32px;">
        Hi ${shippingName}, your Watch Shop order has been shipped via FedEx.
        You can track your package using the link below.
      </p>

      <div style="background: #f9f9f9; border-radius: 8px; padding: 24px; margin-bottom: 32px;">
        <p style="margin: 0 0 8px 0; font-size: 13px; color: #999; text-transform: uppercase; letter-spacing: 1px;">
          Tracking Number
        </p>
        <p style="margin: 0 0 16px 0; font-size: 24px; font-weight: bold; font-family: monospace;">
          ${trackingNumber}
        </p>
        <a 
          href="${trackingUrl}"
          style="display: inline-block; background: black; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-size: 14px;"
        >
          Track your order on FedEx
        </a>
      </div>

      <p style="color: #999; font-size: 13px;">
        If you have any questions about your shipment please reply to this email.
      </p>

    </div>
  `;

  await apiInstance.sendTransacEmail(sendSmtpEmail);
  console.log(`Shipping notification sent to ${to}`);
}

// ----------------------------
// 📧 EMAIL 3 — DEMO COMPLETION
// ----------------------------
// Sent automatically by the cron job when:
// - 24 hours have passed since the order was placed
// - The admin never manually clicked the ship button
//
// Tells the customer:
// - Their demo transaction is complete
// - Their tracking number
// - That ALL their PII has been permanently deleted
export async function sendDemoCompletionEmail({
  to,
  trackingNumber,
  shippingName,
}: {
  to: string;
  trackingNumber: string;
  shippingName: string;
}) {
  const trackingUrl = `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`;

  const sendSmtpEmail = new SendSmtpEmail();

  sendSmtpEmail.sender = { name: FROM_NAME, email: FROM_EMAIL };
  sendSmtpEmail.to = [{ email: to, name: shippingName }];
  sendSmtpEmail.subject = "Your Watch Shop demo order — transaction complete";
  sendSmtpEmail.htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">

      <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 8px;">
        Your order is on its way 📦
      </h1>

      <p style="color: #666; margin-bottom: 32px;">
        Hi ${shippingName}, your En-Visioning Solutions Watch Shop demo order has been processed.
        You can track your package using the link below.
      </p>

      <div style="background: #f9f9f9; border-radius: 8px; padding: 24px; margin-bottom: 32px;">
        <p style="margin: 0 0 8px 0; font-size: 13px; color: #999; text-transform: uppercase; letter-spacing: 1px;">
          Tracking Number
        </p>
        <p style="margin: 0 0 16px 0; font-size: 24px; font-weight: bold; font-family: monospace;">
          ${trackingNumber}
        </p>
        
            <a 
          href="${trackingUrl}"
          style="display: inline-block; background: black; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-size: 14px;"
        >
          Track your order on FedEx
        </a>
      </div>

      <div style="background: #f0f7ff; border: 1px solid #cce0ff; border-radius: 8px; padding: 24px; margin-bottom: 32px;">
        <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: bold; color: #0055cc; text-transform: uppercase; letter-spacing: 1px;">
         Demo Transparency Notice
        </p>
        <p style="margin: 0 0 12px 0; font-size: 14px; color: #333;">
          This is a portfolio demonstration project.
        </p>
        <p style="margin: 0 0 12px 0; font-size: 14px; color: #333;">
          As part of our privacy commitment, this email marks the end 
          of your demo transaction. All personal information associated 
          with this order — including your name, email address, and 
          shipping address — has now been permanently deleted from our 
          system.
        </p>
        <p style="margin: 0; font-size: 14px; color: #333; font-weight: bold;">
          We do not store your data. We do not sell your data.
          This notice confirms that deletion is complete.
        </p>
      </div>

      <p style="color: #999; font-size: 13px;">
        Thank you for helping test this project.
      </p>

    </div>
  `;

  await apiInstance.sendTransacEmail(sendSmtpEmail);
  console.log(`Demo completion email sent to ${to}`);
}

export async function sendRefundConfirmationEmail({
  to,
  shippingName,
  orderTotal,
}: {
  to: string;
  shippingName: string;
  orderTotal: number;
}) {
// This email is sent to the customer when their refund request is approved by the admin.
  const sendSmtpEmail = new SendSmtpEmail();

  sendSmtpEmail.sender = { name: FROM_NAME, email: FROM_EMAIL };
  sendSmtpEmail.to = [{ email: to, name: shippingName }];
  sendSmtpEmail.subject = "Your Watch Shop demo refund request — transaction complete";
  sendSmtpEmail.htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">

      <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 8px;">
        Your refund has been processed 💸
      </h1>

      <p style="color: #666; margin-bottom: 32px;">
        Hi ${shippingName}, your En-Visioning Solutions Watch Shop refund request order has been processed.
      </p>

      <div style="background: #f9f9f9; border-radius: 8px; padding: 24px; margin-bottom: 32px;">
     
      </div>

      <div style="background: #f9f9f9; border-radius: 8px; padding: 24px; margin-bottom: 32px;">
  <p style="margin: 0; font-size: 15px;">
    Amount refunded: <strong>$${orderTotal.toFixed(2)}</strong>
  </p>
</div>

      <div style="background: #f0f7ff; border: 1px solid #cce0ff; border-radius: 8px; padding: 24px; margin-bottom: 32px;">
        <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: bold; color: #0055cc; text-transform: uppercase; letter-spacing: 1px;">
         Demo Transparency Notice
        </p>
        <p style="margin: 0 0 12px 0; font-size: 14px; color: #333;">
          This is a portfolio demonstration project.
        </p>
        <p style="margin: 0 0 12px 0; font-size: 14px; color: #333;">
          As part of our privacy commitment, this email marks the end 
          of your demo transaction. All personal information associated 
          with this order — including your name, email address, and 
          shipping address — has now been permanently deleted from our 
          system.
        </p>
        <p style="margin: 0; font-size: 14px; color: #333; font-weight: bold;">
          We do not store your data. We do not sell your data.
          This notice confirms that deletion is complete.
        </p>
      </div>

      <p style="color: #999; font-size: 13px;">
        Thank you for helping test this project.
      </p>

    </div>
  `;

  await apiInstance.sendTransacEmail(sendSmtpEmail);
  console.log(`Demo completion email sent to ${to}`);
}


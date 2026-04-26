# 🛍️ Watch Shop — Ecommerce with Accessible Design + Secure Admin
  test comment delete later
**Intended use:**
This repository is for personal learning, demonstrating accessible coding pipelines, and showcasing code during interviews or screen shares. While the MIT License allows others to copy and modify this code, it is not intended for commercial use without prior permission.

---

## 🧠 Design Philosophy

This project is built with cognitive accessibility at its core.

Most ecommerce sites show a button that says **"Pay $20"**.

This project shows: **"You will be charged $20 for this item."**

That one change helps users with cognitive impairments understand exactly what is about to happen before they commit. Every design decision in this project follows that same principle — say the full thing, never assume the user already knows.

---

## 📦 What This Project Contains

- A Next.js ecommerce shop (watches)
- Full shopping cart
- Stripe payments with webhooks
- Passwordless admin login using passkeys (WebAuthn)
- MongoDB database
- Refund request flow (customer-facing + admin approval)
- Accessible UI design throughout

---

## 🔑 Environment Variables — Master List

Create a `.env.local` file in the root of the project. It needs all of these:

```bash
# Stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# WebAuthn (Passkey Login)
WEBAUTHN_ORIGIN=http://localhost:3000
WEBAUTHN_RP_ID=localhost
WEBAUTHN_RP_NAME=Watch Shop Admin

# Admin Session
ADMIN_JWT_SECRET=your_long_random_secret_here

# MongoDB
MONGODB_URI=mongodb+srv://...
Mongo_DB_Name=your_database_name

# FedEx Shipping
FEDEX_CLIENT_ID=
FEDEX_CLIENT_SECRET=
FEDEX_ACCOUNT_NUMBER=
FEDEX_API_URL=https://apis-sandbox.fedex.com

# Brevo Transactional Email
BREVO_API_KEY=
BREVO_FROM_EMAIL=
BREVO_FROM_NAME=Watch Shop

# PII Encryption
ENCRYPTION_KEY=your_64_character_hex_string_here

# Cron Job Security
CRON_SECRET=your_64_character_hex_string_here

# Base URL (used for email links and logo)
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

> ⚠️ Never commit `.env.local` to Git. Add it to `.gitignore`.

---

## 🚀 How To Run The Project

```bash
# Step 1 — Install dependencies
npm install

# Step 2 — Add your environment variables (see above)

# Step 3 — Run the development server
npm run dev

# Step 4 — Open in browser
http://localhost:3000
```

---
Step 5 build command : run npm run build to builf the completed file for hosting
---

# 💳 Stripe Payments

## The Simple Version (What Is Actually Happening)

Imagine this:

A customer wants to give you money. You cannot touch their card. Stripe is the trusted adult in the room.

Your job is just to:

1. Tell Stripe how much money
2. Let Stripe collect the card
3. Ask Stripe to finish the payment

That is it. Everything in the payments folder exists to do those 3 things.

---

## 🧠 Type Safety & Database Schema

This project uses TypeScript to enforce strong typing across the application, including MongoDB data models.

### Admin Schema

A dedicated type definition is used to describe the structure of admin documents stored in the database:

```ts
export type AdminCredential = {
  credentialID: string;
};

export type Admin = {
  _id: ObjectId;
  credentials: AdminCredential[];
};
```

### Typed MongoDB Collections

MongoDB collections are strongly typed using the official driver:

```ts
const admins: Collection<Admin> = db.collection<Admin>("admins");
```

This enables:

* Safer database operations
* Autocomplete and better developer experience
* Compile-time validation of queries and updates

### Example: सुरक्षित Credential Removal

```ts
await admins.updateOne(
  { _id: admin._id },
  { $pull: { credentials: { credentialID: id } } }
);
```

TypeScript ensures that only valid fields and structures can be modified, reducing runtime errors and improving maintainability.

---

### Why This Matters

By defining explicit schemas at the application level:

* The risk of invalid database writes is minimized
* Refactoring becomes safer and more predictable
* The codebase remains scalable as new features are added

This approach is especially important for security-sensitive areas such as admin authentication and credential management.
``

## 🌍 The Two Worlds

There are two worlds in this app.

| World | Name | Trust Level |
|---|---|---|
| Server | Safe world | Trusted |
| Browser | Unsafe world | Not trusted |

**Money math must always happen on the server.** Never the browser.

---

## 🔐 Step 1 — The Secret Keys

Stripe gives you two keys.

**Public key** → Goes in the browser. Safe to show.
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**Secret key** → Server only. Never expose this.
```
STRIPE_SECRET_KEY=sk_test_...
```

If Stripe says `"Publishable key undefined"` — your public key is missing or misspelled.

---

## 🧠 Step 2 — The Most Important File

**File: `createPaymentIntent.ts`**

This file runs on the server. Its job:

1. Look at the cart
2. Add up the total
3. Multiply by 100 (Stripe wants cents, not dollars)
4. Ask Stripe to create a PaymentIntent
5. Return the secret code to the browser

```typescript
"use server";

import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function createPaymentIntent(cartItems) {
  const total = cartItems.reduce((acc, item) => {
    return acc + item.price * item.quantity;
  }, 0);

  const amount = Math.round(total * 100); // Dollars → cents

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: "usd",
    automatic_payment_methods: { enabled: true },
  });

  return paymentIntent.client_secret;
}
```

> If the Stripe dashboard shows the wrong amount — this file is wrong. Check here first.

---

## 💡 Why Multiply By 100?

Stripe speaks cents. You speak dollars.

```
$240.00  →  Stripe wants 24000
```

If you forget this, the payment amount will be wrong.

---

## 🔒 Step 3 — The Browser Needs Permission

Stripe does not let the browser collect card info without permission. The permission is the `client_secret`.

That secret says: *"This browser is allowed to complete THIS specific payment."*

Without it, nothing works. That is why you must:

1. Call `createPaymentIntent`
2. Save the returned secret
3. Pass it into `<Elements>`

---

## 🎁 Step 4 — The Stripe Wrapper

Stripe requires this wrapper around your checkout form:

```tsx
<Elements stripe={stripePromise} options={{ clientSecret }}>
  <CheckoutForm />
</Elements>
```

This wrapper is not optional. If you remove it:
- `useStripe()` will be `null`
- `PaymentElement` won't work
- Confirm payment fails

---

## 💳 Step 5 — The Checkout Form

This is the only thing the user sees:

```tsx
<PaymentElement />
```

That component handles card input, validation, fraud detection, and 3D Secure. Your server never sees the card.

Then this runs when the user confirms:

```typescript
stripe.confirmPayment({
  elements,
  confirmParams: {
    return_url: "/success"
  }
});
```

---

## ✅ Step 6 — The Success Page

When payment is done, Stripe redirects to `/success`.

This page must:
- Clear the cart
- Show a confirmation message

> If you don't clear the cart, the user might accidentally pay again.

---

## 🔄 Webhooks — Why They Are Required

When payment confirmation happens on the frontend, the frontend cannot be trusted as the source of truth.

This project uses a Stripe webhook to:
- Confirm that `payment_intent.succeeded` actually occurred
- Retrieve trusted shipping information from the PaymentIntent
- Reduce product inventory
- Create the order in MongoDB
- Prevent duplicate orders

**Shipping information flow:**
1. User enters shipping details in a form
2. Server attaches shipping data to the PaymentIntent
3. Stripe confirms payment
4. Webhook receives `payment_intent.succeeded`
5. Shipping data is read from Stripe
6. Order is created in the database

---

## 🛠️ How To Test Stripe Locally

You need the Stripe CLI installed.

```bash
# Step 1
curl -s https://packages.stripe.dev/api/security/keypair/stripe-cli-gpg/public | gpg --dearmor | sudo tee /usr/share/keyrings/stripe.gpg

# Step 2
echo "deb [signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.dev/stripe-cli-debian-local stable main" | sudo tee -a /etc/apt/sources.list.d/stripe.list

# Step 3
sudo apt update

# Step 4
sudo apt install stripe

# Step 5
stripe login
```

When prompted, press Enter to open the browser. Connect the CLI to the correct Stripe account (the one named "watchshop" — not your personal one).

Then run the webhook listener:

```bash
stripe listen --forward-to localhost:3000/api/stripe-webhook
```

> Both the Stripe CLI listener AND `npm run dev` must be running at the same time for local testing to work.

---

## 🚨 If Stripe Breaks

| Symptom | Cause | Fix |
|---|---|---|
| Clicking pay does nothing | StripeWrapper missing or clientSecret not loaded | Check `<Elements>` wrapper exists |
| Wrong amount charged | Math wrong in `createPaymentIntent` | Check the multiply by 100 step |
| "Publishable key undefined" | Missing `NEXT_PUBLIC_` prefix | Fix env variable name |
| Payment shows incomplete | Wrong test card used | Use Stripe test card `4242 4242 4242 4242` |

---

## 🔁 The Three Rules That Never Change

1. Never trust the frontend for money
2. Always multiply by 100
3. Never expose the secret key

---

---

# 🔐 Admin Passkey Authentication (WebAuthn)

## What Is a Passkey?

A passkey is a way to log in using your device's biometrics (fingerprint, Face ID, Windows Hello) instead of a password.

- No password is stored anywhere
- Your private key never leaves your device
- Even if the database is hacked, there is nothing useful there
- Phishing resistant — fake sites cannot steal your login

---

## 🏗️ How To Install

```bash
npm install @simplewebauthn/server @simplewebauthn/browser
```

> This project uses `@simplewebauthn` v13. The API changed significantly from v9 to v10. See the troubleshooting section if upgrading.

---

## 📁 File Structure

```
app/
├─ admin/
│   ├─ register/page.tsx       ← Register a new passkey
│   ├─ login/page.tsx          ← Login with passkey
│   └─ layout.tsx              ← Protects all /admin routes
│
└─ api/
    └─ admin/
        ├─ registration-challenge/route.ts
        ├─ registration-verify/route.ts
        ├─ authentication-challenge/route.ts
        └─ authentication-verify/route.ts

lib/
├─ mongodb.ts
└─ auth.ts
```

---

## 🔄 Registration Flow (Step-by-Step)

This is how a new passkey gets saved to the database.

```
1. Admin clicks "Register Passkey"
       ↓
2. Browser calls /api/admin/registration-challenge
       ↓
3. Server generates a one-time challenge → saves to MongoDB
       ↓
4. Browser prompts biometric/device (fingerprint, Face ID, etc.)
       ↓
5. Browser sends response to /api/admin/registration-verify
       ↓
6. Server verifies response and stores:
       - credentialID  (base64url string)
       - publicKey     (Binary, stored in MongoDB)
       - counter       (starts at 0)
```

---

## 🔄 Authentication Flow (Step-by-Step)

This is how login works after a passkey is registered.

```
1. Admin clicks "Login with Passkey"
       ↓
2. Browser calls /api/admin/authentication-challenge
       ↓
3. Server generates a one-time challenge → saves to MongoDB
       ↓
4. Browser prompts biometric/device
       ↓
5. Browser sends response to /api/admin/authentication-verify
       ↓
6. Server looks up credential by credentialID
       ↓
7. Server verifies the cryptographic signature
       ↓
8. Server updates the counter in MongoDB (prevents replay attacks)
       ↓
9. JWT session cookie is issued → admin is logged in
```

---

## 🗄️ MongoDB Credential Structure

This is the exact shape of what gets stored during registration:

```json
{
  "userId": "admin-id",
  "credentialID": "base64url-string-here",
  "publicKey": "<Binary — MongoDB Binary type, NOT a plain string>",
  "counter": 0,
  "currentChallenge": "temporarily stored here during auth, cleared after"
}
```

> ⚠️ `publicKey` is stored as a MongoDB `Binary` type. When reading it back, you must use `.value()` not `.buffer` — see the troubleshooting section.

---

## 🍪 Session Management (JWT)

After a successful passkey login, the server issues a JWT stored in a secure cookie.

```typescript
const token = jwt.sign(
  { adminId: admin._id.toString(), role: "admin" },
  process.env.ADMIN_JWT_SECRET!,
  { expiresIn: "2h" }
);

response.cookies.set("admin_token", token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/",
  maxAge: 60 * 60 * 2,
});
```

The cookie is HTTP-only so JavaScript cannot read it. This prevents XSS attacks from stealing the session.

---

## 🛡️ How To Generate a JWT Secret

Run this in your terminal:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy the result into your `.env.local`:

```
ADMIN_JWT_SECRET=paste_result_here
```

---

## 🔒 Route Protection

**Dashboard page** (`app/admin/dashboard/page.tsx`) — checks the JWT on every request:

```typescript
const token = cookies().get("admin_token")?.value;
if (!token) redirect("/admin/login");
jwt.verify(token, process.env.ADMIN_JWT_SECRET!);
```

**API routes** — every `/api/admin/*` route must independently verify the JWT:

```typescript
function verifyAdmin() {
  const token = cookies().get("admin_token")?.value;
  if (!token) throw new Error("Unauthorized");
  return jwt.verify(token, process.env.ADMIN_JWT_SECRET!);
}
```

---

## 🚨 If Passkey Login Breaks

### "Cannot read properties of undefined (reading 'counter')"

This means you are using the v9 API shape with v10+ installed.

```typescript
// ❌ v9 shape — DO NOT USE with v13
authenticator: {
  credentialID: isoBase64URL.toBuffer(credential.credentialID),
  credentialPublicKey: new Uint8Array(...),
  counter: Number(credential.counter),
}

// ✅ v13 shape — USE THIS
credential: {
  id: credential.credentialID,          // base64url string, NOT a buffer
  publicKey: new Uint8Array(...),
  counter: Number(credential.counter),
}
```

Also: in v13 you can pass `body` directly to `verifyAuthenticationResponse`. You do not need to manually decode `clientDataJSON`, `authenticatorData`, etc. The library handles that.

---

### "Credential not found"

The `credentialID` stored in MongoDB does not match `body.id` coming from the browser. Check for base64url padding differences or encoding mismatches.

Add this debug log to find the problem:

```typescript
console.log("body.id:", body.id);
console.log("stored ID:", credential.credentialID);
console.log("match:", credential.credentialID === body.id);
```

---

### "Response signature invalid"

The publicKey was extracted from MongoDB Binary incorrectly.

```typescript
// ❌ Wrong — may give empty or wrong buffer
new Uint8Array((credential.publicKey as Binary).buffer)

// ✅ Correct for MongoDB driver v5+
new Uint8Array((credential.publicKey as Binary).value())
```

---

### "Expected origin not found"

`WEBAUTHN_ORIGIN` must exactly match your app's URL — no trailing slash, exact protocol.

```bash
# ✅ Correct
WEBAUTHN_ORIGIN=http://localhost:3000

# ❌ Wrong
WEBAUTHN_ORIGIN=http://localhost:3000/
WEBAUTHN_ORIGIN=localhost:3000
```

---

### Challenge expired or not found

The challenge is stored in MongoDB and cleared after use. If you are getting this error, the most likely cause is that the challenge was cleared before verification ran, or you are running two instances of the server.

---

## 🧱 Security Layers Summary

| Layer | What It Protects Against |
|---|---|
| WebAuthn passkey | Password brute force, phishing |
| One-time challenge | Replay attacks |
| Counter tracking | Signature reuse |
| JWT signing | Session tampering |
| HTTP-only cookie | XSS token theft |
| Route verification | Unauthorized dashboard access |
| API verification | Direct API abuse, cURL attacks |

---

---

# ♿ Accessibility Pipeline (Coming Next)

This project is building toward an automated accessibility testing pipeline so that only accessible code can be merged and approved.

The goal is to gain hands-on experience with:
- Automated accessibility auditing (axe-core, Lighthouse CI)
- Pull request checks that block inaccessible code
- WCAG 2.1 AA compliance as a baseline

This section will be expanded as the pipeline is built.

---

---

# 📦 FedEx Shipping Integration

## What This Does

When the admin clicks the Ship button on the shipping page, this project:

1. Verifies the admin is logged in
2. Fetches the order from MongoDB and decrypts the PII
3. Validates the recipient country is supported by FedEx sandbox
4. Gets a short-lived FedEx OAuth token
5. Sends a shipment request to the FedEx sandbox API
6. Extracts the tracking number from the response
7. Saves the tracking number to the order document in MongoDB
8. Sends a shipping notification email to the customer

The order remains in MongoDB after this. Deletion happens via the cron job after 24 hours — this gives time to simulate refunds, disputes, and other Stripe features before everything is wiped.

---

## 🔑 How To Get FedEx Sandbox Credentials

1. Go to [developer.fedex.com](https://developer.fedex.com)
2. Create a free developer account
3. Create a new project — select **Ship API**
4. Copy the **Client ID** and **Client Secret** into your `.env.local`
5. Your **Account Number** is in your FedEx profile

```bash
FEDEX_CLIENT_ID=your_client_id
FEDEX_CLIENT_SECRET=your_client_secret
FEDEX_ACCOUNT_NUMBER=your_account_number
FEDEX_API_URL=https://apis-sandbox.fedex.com
```

> For production change `FEDEX_API_URL` to `https://apis.fedex.com`

---

## 🌍 Supported Countries (Sandbox)

The FedEx sandbox only accepts shipments to certain countries. The route validates this before calling FedEx so the admin gets a clear error instead of a cryptic FedEx response.

```typescript
const SUPPORTED_COUNTRIES = [
  "US", "CA", "GB", "AU", "DE", "FR", "JP", "MX", "NL", "IT"
];
```

---

## 🔄 Authentication Flow

FedEx uses OAuth2. A token is fetched fresh on every shipment request — they are short lived and cannot be stored.

```typescript
// lib/fedex.ts
export async function getFedExToken() {
  const res = await fetch(`${process.env.FEDEX_API_URL}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.FEDEX_CLIENT_ID!,
      client_secret: process.env.FEDEX_CLIENT_SECRET!,
    }),
  });
  const data = await res.json();
  return data.access_token;
}
```

---

## 📍 Tracking Numbers in Sandbox

Sandbox tracking numbers are real-looking but static. They will appear on `fedex.com/fedextrack` but will never update their status. This is expected — sandbox does not simulate delivery events.

---

## 🚨 Common FedEx Errors

| Error | Cause | Fix |
|---|---|---|
| `RECIPIENT.COUNTRY.INVALID` | Country not in supported list | Validate against `SUPPORTED_COUNTRIES` before calling |
| `REQUESTEDSHIPMENT.LABELSPECIFICATION.REQUIRED` | Missing label spec block | Add `labelSpecification` with `labelFormatType`, `imageType`, `labelStockType` |
| `401 Unauthorized` | Token expired or wrong credentials | Check `FEDEX_CLIENT_ID` and `FEDEX_CLIENT_SECRET` |
| No tracking number returned | Wrong path in response | Check `output.transactionShipments[0].masterTrackingNumber` |

---

---

# 📧 Brevo Transactional Emails

## What This Does

This project sends transactional emails via the Brevo API. A transactional email is a one-to-one email triggered by a specific event — not a newsletter or bulk send.

| Email | Triggered by | Caller | Recipient |
|---|---|---|---|
| Order confirmation | Stripe webhook after payment | `api/stripe-webhook/route.ts` | Customer |
| Shipping notification | Admin clicks ship button | `api/admin/fedex-shipment/route.ts` | Customer |
| Refund confirmation | Admin clicks approve | `api/admin/refund/[orderId]/route.ts` | Customer |
| Demo completion | Cron job after 24 hours | `api/cron/process-pending-orders/route.ts` | Customer |

---

## 🧠 The Mental Model — What Actually Triggers An Email

This is the most important thing to understand before building anything.

You are used to tying emails to button clicks in React. In a server-side app, the same idea applies — but the "button" is different depending on who triggers the event. The email never fires from the browser directly. The browser tells the server what happened. The server sends the email.

**The flow always looks like this:**

```
Something happens → Server-side code runs → mailer function called → Brevo sends email
```

The mailer functions in `lib/mailer.ts` are just templates. They never fire themselves. Something server-side always has to call them at the right moment.

---

## 🔁 Trigger Types

### Ecommerce (Stripe-driven)

When a payment succeeds, Stripe sends a POST request to your webhook route. The webhook handler calls the mailer after saving the order. The browser is not involved at all.

```
Customer pays on Stripe
→ Stripe fires POST to /api/stripe-webhook
→ webhook saves order to MongoDB
→ webhook calls sendOrderConfirmation()
→ Brevo sends the email
```

The key insight: you never call the email from the browser. The browser only talks to Stripe. Stripe talks to your server. Your server sends the email.

### Admin action (button-driven)

When an admin clicks a button in the dashboard, the browser calls your API route. The API route does the work and calls the mailer.

```
Admin clicks "Approve Refund"
→ browser calls POST /api/admin/refund/[orderId]
→ API route calls Stripe to process the refund
→ API route calls sendRefundConfirmationEmail()
→ Brevo sends the email to the customer
```

```
Admin clicks "Ship"
→ browser calls POST /api/admin/fedex-shipment
→ API route calls FedEx, saves tracking number
→ API route calls sendShippingNotification()
→ Brevo sends the email to the customer
```

### Scheduled (cron-driven)

When a cron job runs on a schedule, it calls the mailer directly inside the cron route.

```
Vercel cron fires at 9am UTC
→ cron route finds orders older than 24 hours
→ for each order, calls sendDemoCompletionEmail()
→ Brevo sends the email to each customer
```

---

## 🔑 How To Get Brevo Credentials

1. Create a free account at [brevo.com](https://brevo.com)
2. Go to **SMTP & API → API Keys**
3. Create a new API key
4. Go to **Senders & IP → Senders** and verify your sender email address
5. Add to `.env.local`:

```bash
BREVO_API_KEY=your_api_key
BREVO_FROM_EMAIL=your_verified_sender@example.com
BREVO_FROM_NAME=Watch Shop
```

> ⚠️ The `BREVO_FROM_EMAIL` must be a verified sender. You cannot send from an unverified address — Brevo will reject the request silently.

> ⚠️ Do not use Zoho free tier SMTP for transactional email. Free Zoho plans block SMTP authentication. Use Brevo instead.

---

## 📦 Installation

```bash
npm install @getbrevo/brevo
```

---

## 🧱 Setup Pattern

```typescript
// lib/mailer.ts
import {
  TransactionalEmailsApi,
  TransactionalEmailsApiApiKeys,
  SendSmtpEmail
} from "@getbrevo/brevo";

const apiInstance = new TransactionalEmailsApi();
apiInstance.setApiKey(
  TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY!
);

const FROM_NAME = process.env.BREVO_FROM_NAME!;
const FROM_EMAIL = process.env.BREVO_FROM_EMAIL!;
```

This runs once when the module is loaded. Every email function in the file shares the same `apiInstance`.

---

## 🏗️ Adding a New Email — Step by Step

### Step 1 — Write the template in `lib/mailer.ts`

Every email function follows the same pattern. Copy an existing one as your starting point.

```typescript
export async function sendYourEmail({
  to,
  name,
}: {
  to: string;
  name: string;
}) {
  const sendSmtpEmail = new SendSmtpEmail();

  sendSmtpEmail.sender = { name: FROM_NAME, email: FROM_EMAIL };
  sendSmtpEmail.to = [{ email: to, name }];
  sendSmtpEmail.subject = "Your subject here";
  sendSmtpEmail.htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
      <p>Hi ${name},</p>
      <p>Your message here.</p>
    </div>
  `;

  await apiInstance.sendTransacEmail(sendSmtpEmail);
  console.log(`Your email sent to ${to}`);
}
```

### Step 2 — Call it from the right server-side location

Import the function and call it at the correct moment inside your API route, webhook handler, or cron route.

```typescript
import { sendYourEmail } from "@/lib/mailer";

// After the event that triggers the email succeeds:
await sendYourEmail({ to: email, name: customerName });
```

### Step 3 — Handle encrypted PII if needed

If the email address or name comes from a MongoDB order document, it will be stored encrypted. Decrypt it before passing to the mailer.

```typescript
import { safeDecrypt } from "@/lib/encryption";

const customerEmail = safeDecrypt(order.email);
const customerName = safeDecrypt(order.shippingName) || "Customer";

if (customerEmail) {
  await sendYourEmail({ to: customerEmail, name: customerName });
}
```

Always guard with `if (customerEmail)` — `safeDecrypt` returns `null` if decryption fails rather than throwing. This prevents a broken decryption from crashing your whole API route.

---

## 🖼️ Adding A Logo To Emails

Emails cannot reference local files or relative paths. The logo must be an absolute URL pointing to a hosted file.

Since this project is deployed on Vercel, any file in your `/public` folder is accessible at your domain:

```html
<img
  src="${process.env.NEXT_PUBLIC_BASE_URL}/your-logo.jpg"
  alt="Watch Shop"
  style="height: 48px; width: auto;"
/>
```

Add to `.env.local`:
```bash
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

In production this should be your live Vercel URL. The logo will not appear in local email previews until the file is deployed and publicly accessible.

---

## 🔁 How To Rebuild This In A New Project

- [ ] Create account at brevo.com and verify your sender email address
- [ ] `npm install @getbrevo/brevo`
- [ ] Add `BREVO_API_KEY`, `BREVO_FROM_EMAIL`, `BREVO_FROM_NAME` to `.env.local`
- [ ] Add `NEXT_PUBLIC_BASE_URL` to `.env.local`
- [ ] Create `lib/mailer.ts` — init `TransactionalEmailsApi`, set API key
- [ ] Write one email function per email type
- [ ] In each server-side caller (webhook, API route, cron), import and call the mailer function at the right moment
- [ ] If the recipient data comes from MongoDB and is encrypted, decrypt with `safeDecrypt` before passing it in
- [ ] Guard every email call with `if (customerEmail)` to handle decryption failures gracefully

---

---

# 💸 Refund Flow

## What This Does

This project implements a token-based refund request flow. Customers do not get a self-serve instant refund button — they submit a request, and the admin reviews and approves or rejects it. This mirrors how real ecommerce stores handle refunds.

**The full flow:**

```
Customer receives order confirmation email
→ Email contains a unique "Request a refund" link
→ Customer clicks the link → lands on /refund-request page
→ Customer selects a reason and submits
→ Admin sees a "Refund Requested" badge on the orders page
→ Admin clicks Approve → Stripe processes the refund → customer receives refund email
   OR
→ Admin clicks Reject → refundStatus updated to rejected
```

---

## 🔑 How The Token Works

No customer account or login is needed. Instead, a unique token is generated when the order is created and stored on the order document. The token is embedded in the refund link in the confirmation email.

When the customer visits the link, the server looks up the token in MongoDB and validates it matches the order ID in the URL. If both match, the page loads. If not, the customer sees an error.

This means:
- Only the person who received the confirmation email can access the refund page
- The token is single-use in practice (refund status prevents double submission)
- No auth system needed

---

## 🗄️ Order Document Fields Added

Two fields are added to every order at creation time in the Stripe webhook:

```typescript
refundToken: randomUUID(),   // unique token for the refund link
refundStatus: "none",        // none | requested | approved | rejected
```

When a refund is requested, two more fields are added:

```typescript
refundReason: "changed_mind",       // from the dropdown
refundNote: "Optional note here",   // from the textarea
refundRequestedAt: new Date(),
```

---

## 📁 File Structure

```
app/
├─ refund-request/
│   ├─ page.tsx                  ← server component, validates token
│   └─ RefundRequestForm.tsx     ← client component, the form UI
│
api/
├─ refund-request/
│   └─ route.ts                  ← handles POST from the form
│
api/admin/
├─ refund/
│   └─ [orderId]/
│       └─ route.ts              ← admin approve/reject, calls Stripe
```

---

## 🔄 Refund Request Page States

The server component at `app/refund-request/page.tsx` handles four states before the form ever renders:

| State | What The Customer Sees |
|---|---|
| Token or order ID missing from URL | "Invalid link" error message |
| Token does not match order in MongoDB | "Invalid link" error message |
| `refundStatus` is already `requested` | "Already submitted" message |
| `refundStatus` is `approved` or `rejected` | "Request already processed" message |
| `refundStatus` is `none` | The refund request form |

The token is validated twice — once in the server component before the page loads, and again in the API route when the form is submitted.

---

## 🔁 How To Rebuild This In A New Project

- [ ] Add `refundToken: randomUUID()` and `refundStatus: "none"` to the order document at creation time
- [ ] Import `randomUUID` from `"crypto"` — no package needed, it is built into Node
- [ ] Add `findByRefundToken(token)` method to your OrderDAO
- [ ] Add `updateRefundStatus(orderId, status, reason?, note?)` method to your OrderDAO
- [ ] Create `app/refund-request/page.tsx` — server component, reads token from URL search params, validates against DB, renders form or appropriate error state
- [ ] Create `app/refund-request/RefundRequestForm.tsx` — client component with reason dropdown and notes textarea
- [ ] Create `app/api/refund-request/route.ts` — validates token again, checks `refundStatus === "none"`, calls `updateRefundStatus`
- [ ] Add refund link to confirmation email: `${baseUrl}/refund-request?token=${refundToken}&order=${orderId}`
- [ ] Declare `refundToken` and `orderId` outside the MongoDB transaction so they are in scope when `sendOrderConfirmation` is called
- [ ] Add Refund column to admin orders table — show badge + approve/reject buttons when `refundStatus === "requested"`
- [ ] Create `app/api/admin/refund/[orderId]/route.ts` — verify admin JWT, fetch order, call `stripe.refunds.create()` if approving, call `updateRefundStatus`, send refund confirmation email
- [ ] Decrypt PII with `safeDecrypt` before passing email and name to the refund confirmation email function

---

## 🚨 Troubleshooting The Refund Flow

These are real bugs that came up building this feature.

### "Invalid link" even though the token is saved in MongoDB

The token in the email URL does not match the token stored in MongoDB. This happens when `randomUUID()` is called twice — once to save to the database, and once separately when building the email URL. They produce different values every time.

The fix is to generate the token once, assign it to a variable, use that variable in both `createOrder` and `sendOrderConfirmation`.

```typescript
// ❌ Wrong — two different tokens
await orderDAO.createOrder({ refundToken: randomUUID() });
await sendOrderConfirmation({ refundToken: randomUUID() }); // different value!

// ✅ Correct — one token used in both places
const generatedToken = randomUUID();
await orderDAO.createOrder({ refundToken: generatedToken });
refundToken = generatedToken; // capture for use after transaction
await sendOrderConfirmation({ refundToken }); // same value
```

---

### Token in email URL is empty (`token=&order=...`)

`refundToken` was declared outside the transaction but never assigned inside it. The variable stays as an empty string.

```typescript
// ❌ Wrong — assignment is missing
let refundToken = "";
await session.withTransaction(async () => {
  const generatedToken = randomUUID();
  await orderDAO.createOrder({ refundToken: generatedToken });
  // forgot: refundToken = generatedToken
});
await sendOrderConfirmation({ refundToken }); // empty string

// ✅ Correct — assign inside the transaction
let refundToken = "";
await session.withTransaction(async () => {
  const generatedToken = randomUUID();
  await orderDAO.createOrder({ refundToken: generatedToken });
  refundToken = generatedToken; // ← this line is required
});
await sendOrderConfirmation({ refundToken }); // correct value
```

---

### Admin approve button returns 401

Two possible causes:

**1. Using `verifyAdminPage()` instead of `verifyAdminApi()` in the route.**
Page verification redirects on failure. API verification returns a response. Use the right one:

```typescript
// ❌ Wrong in an API route
const admin = await verifyAdminPage();
if (!admin.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

// ✅ Correct in an API route
const adminCheck = await verifyAdminApi();
if (adminCheck instanceof NextResponse) return adminCheck;
```

**2. Checking `.ok` on the result of `verifyAdminApi()`.**
`verifyAdminApi` returns either an `AdminToken` object or a `NextResponse` — it has no `.ok` property. Use `instanceof NextResponse` to check for failure.

---

### `searchParams` or `params` is a Promise error (Next.js 15)

Next.js 15 made both `searchParams` and `params` async. You must await them before accessing properties.

```typescript
// ❌ Wrong — Next.js 15 will throw
export default async function Page({ searchParams }) {
  const token = searchParams.token;
}

// ✅ Correct
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; order?: string }>;
}) {
  const { token, order } = await searchParams;
}
```

Same fix applies to dynamic route params:

```typescript
// ❌ Wrong
export async function POST(req, { params }) {
  const id = params.orderId;
}

// ✅ Correct
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await params;
}
```

---

### TypeScript error parsing `.tsx` file with type annotations

If a `.tsx` file produces a parse error on the `}: {` type annotation pattern, the file is likely saved as `.jsx`. JSX does not support TypeScript syntax.

```bash
# Check the actual extension on disk
ls app/refund-request/

# Rename if still .jsx
mv app/refund-request/RefundRequestForm.jsx app/refund-request/RefundRequestForm.tsx

# If the rename doesn't fix it, check what's actually in the file
cat app/refund-request/RefundRequestForm.tsx | head -20
```

If the file on disk still has the wrong syntax, fix it directly:

```bash
sed -i 's/} {$/}: {/' app/refund-request/RefundRequestForm.tsx
```

---

---

# 🔒 PII Encryption (AES-256-GCM)

## Why This Exists

Customer PII (name, email, shipping address) is stored encrypted in MongoDB. If the database is ever breached, those fields are unreadable without the encryption key.

This project uses **field-level encryption** — only the PII fields are encrypted, not the entire document. This means:

- Non-PII fields (total, items, status) are readable without decryption
- Only the fields that could identify a person are protected
- Easy to explain in interviews: "I encrypted these specific fields because they are PII"

---

## 🔑 How To Generate The Encryption Key

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

The result is a 64 character hex string representing 32 bytes — the exact key size required for AES-256.

```bash
ENCRYPTION_KEY=paste_64_character_result_here
```

---

## 🔐 The Algorithm — AES-256-GCM

| Part | What It Means |
|---|---|
| AES | Advanced Encryption Standard — used by banks and governments |
| 256 | 256 bit key — extremely hard to brute force |
| GCM | Galois/Counter Mode — includes an authentication tag that proves data was not tampered with |

---

## 🧱 The Encryption Utility

All encryption and decryption lives in one file: `lib/encryption.ts`

```typescript
encrypt(value: string)      // encrypts a string → returns "iv:authTag:encrypted"
decrypt(value: string)      // decrypts back to original string
safeDecrypt(value: string)  // same as decrypt but returns null instead of throwing
```

Every encrypted value is stored as a single string in the format:

```
iv:authTag:encryptedData
```

A new random IV (initialisation vector) is generated for every encryption. This means encrypting the same value twice produces different output each time — making the encrypted data harder to analyse.

---

## 📍 Where Encryption Happens

| Location | Action |
|---|---|
| Stripe webhook | `encrypt()` called before saving order to MongoDB |
| Shipping page | `safeDecrypt()` called when rendering the table |
| Orders page | `safeDecrypt()` called when rendering the table |
| FedEx shipment route | `decrypt()` called before building the FedEx payload |
| Refund approval route | `safeDecrypt()` called before sending refund confirmation email |
| Cron job | `safeDecrypt()` called before sending the demo completion email |

---

## 🔁 How To Rebuild This In A New Project

- [ ] Generate key: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- [ ] Add `ENCRYPTION_KEY` to `.env.local`
- [ ] Create `lib/encryption.ts` with `encrypt`, `decrypt`, `safeDecrypt`
- [ ] Call `encrypt()` on PII fields before any MongoDB write
- [ ] Call `safeDecrypt()` on PII fields before any display
- [ ] Call `decrypt()` on PII fields when you need the value for an API call (FedEx, email, etc)
- [ ] Never write decrypted PII back to the database

---

---

# ⏰ Automated Cron Job — Auto-Ship + Auto-Delete

## What This Does

The cron job runs once a day at 9am UTC via Vercel. It does two jobs in a single pass:

**Job 1 — Auto-Ship (runs at 12 hour mark)**
Finds orders older than 12 hours with no tracking number. The admin had 12 hours to manually click ship — if they didn't, the cron does it automatically. Calls FedEx sandbox, saves the tracking number, sends the shipping notification email.

**Job 2 — Auto-Delete (runs at 24 hour mark)**
Finds all orders older than 24 hours. Sends the demo completion email with the tracking number. Deletes the full order record from MongoDB permanently.

This means the demo runs completely hands-off after deployment. No admin interaction is required for any order ever.

---

## 🔄 The Full Automated Lifecycle

```
Order placed → order confirmation email fires immediately
      ↓
9am UTC next day — cron runs
Job 1 finds order (older than 12hrs, no tracking number)
Auto-calls FedEx → tracking number saved → shipping email fires ✅
      ↓
9am UTC the following day — cron runs again
Job 2 finds order (older than 24hrs)
Demo completion email fires with tracking number ✅
Full order deleted from MongoDB ✅
      ↓
Nothing remains in MongoDB after 24 hours ✅
```

---

## 🔄 What If Admin Clicks Ship Manually?

If the admin clicks the ship button before the 12 hour mark:

```
Admin clicks ship → FedEx called → tracking number saved → shipping email fires
Order stays in MongoDB (NOT deleted yet)
      ↓
Next day cron runs — Job 1 skips it (already has tracking number)
Job 2 finds it (older than 24hrs) → demo completion email → deleted ✅
```

---

## 📁 File Locations

```
app/api/cron/process-pending-orders/route.ts  ← the cron route
vercel.json                                    ← tells Vercel when to run it
```

---

## ⚙️ Vercel Configuration

`vercel.json` lives at the root of the project (same level as `package.json`):

```json
{
  "crons": [
    {
      "path": "/api/cron/process-pending-orders",
      "schedule": "0 9 * * *"
    }
  ]
}
```

`0 9 * * *` means every day at 9am UTC.

> ⚠️ Vercel free tier only supports daily cron jobs. Hourly requires Vercel Pro.

---

## 🔐 Security

The cron route is protected by a secret. Vercel sends it in the `Authorization` header automatically. Without this check, anyone who finds the URL could trigger mass deletion and emails.

```bash
# Generate with:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Add to .env.local:
CRON_SECRET=paste_result_here
```

The route checks:

```typescript
const authHeader = req.headers.get("authorization");
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

---

## 🧪 How To Test Locally

The cron job only runs on Vercel automatically. To test it locally use curl:

```bash
curl -X GET http://localhost:3000/api/cron/process-pending-orders \
  -H "Authorization: Bearer YOUR_CRON_SECRET_HERE"
```

To test without waiting 12 or 24 hours, temporarily change the time windows in the cron route:

```typescript
// TEMP for testing — change back before deploying
const twelveHourCutoff = new Date(now - 2 * 60 * 1000);  // 2 minutes
const twentyFourHourCutoff = new Date(now - 3 * 60 * 1000); // 3 minutes
```

Restore before deploying:

```typescript
// REAL values
const twelveHourCutoff = new Date(now - 12 * 60 * 60 * 1000);
const twentyFourHourCutoff = new Date(now - 24 * 60 * 60 * 1000);
```

---

## 📧 The Demo Completion Email

Sent by Job 2 when an order hits 24 hours. Tells the customer:

- Their tracking number
- That this was a demo project
- That all their personal data has been permanently deleted

This is a deliberate transparency decision — the customer receives written confirmation that their PII is gone.

---

## 🚨 What If There Is No Tracking Number At The 24 Hour Mark?

This should not happen in normal flow because Job 1 runs at 12 hours and generates a tracking number. However if FedEx fails during auto-ship, Job 2 will still delete the order but skip the demo completion email. No email is better than a broken email with no tracking number.

---

---

# 🔁 Full Rebuild Checklist

If you have lost all memory of this project but still know how to code, follow these steps in order.

## Stripe

- [ ] `npm install stripe @stripe/stripe-js @stripe/react-stripe-js`
- [ ] Add Stripe env variables (public + secret)
- [ ] Create `createPaymentIntent` server action — calculate total, multiply by 100, return `client_secret`
- [ ] Wrap checkout page in `<Elements stripe={...} options={{ clientSecret }}>`
- [ ] Render `<PaymentElement />` inside the form
- [ ] Call `stripe.confirmPayment()` on submit with `return_url: "/success"`
- [ ] Create `/success` page — clear cart, show confirmation
- [ ] Create webhook at `/api/stripe-webhook` — handle `payment_intent.succeeded`
- [ ] Add `STRIPE_WEBHOOK_SECRET` to env variables
- [ ] Test with Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe-webhook`

## Admin Passkey Auth

- [ ] `npm install @simplewebauthn/server @simplewebauthn/browser`
- [ ] Generate JWT secret: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- [ ] Add `WEBAUTHN_ORIGIN`, `WEBAUTHN_RP_ID`, `WEBAUTHN_RP_NAME`, `ADMIN_JWT_SECRET` to env
- [ ] Create `registration-challenge` route — `generateRegistrationOptions()`, save challenge to MongoDB
- [ ] Create `registration-verify` route — `verifyRegistrationResponse()`, store `credentialID`, `publicKey` (Binary), `counter` (0)
- [ ] Create `authentication-challenge` route — `generateAuthenticationOptions()`, save challenge to MongoDB
- [ ] Create `authentication-verify` route — look up credential, call `verifyAuthenticationResponse()` with v13 `credential:` shape, update counter, issue JWT cookie
- [ ] Create `admin/login/page.tsx` — trigger auth challenge + verify flow
- [ ] Protect `admin/dashboard/page.tsx` — verify JWT cookie server-side, redirect if invalid
- [ ] Add `verifyAdmin()` helper to every `/api/admin/*` route

## PII Encryption

- [ ] Generate key: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- [ ] Add `ENCRYPTION_KEY` to `.env.local`
- [ ] Create `lib/encryption.ts` with `encrypt`, `decrypt`, `safeDecrypt` using `aes-256-gcm`
- [ ] In Stripe webhook — wrap `email`, `shippingName`, `shippingAddress` in `encrypt()` before saving
- [ ] In shipping page — use `safeDecrypt()` on all PII fields before rendering
- [ ] In orders page — use `safeDecrypt()` on all PII fields before rendering
- [ ] In FedEx route — use `decrypt()` before building payload and sending email

## FedEx Shipping

- [ ] Create developer account at developer.fedex.com
- [ ] Add `FEDEX_CLIENT_ID`, `FEDEX_CLIENT_SECRET`, `FEDEX_ACCOUNT_NUMBER`, `FEDEX_API_URL` to env
- [ ] Create `lib/fedex.ts` — `getFedExToken()` fetches OAuth token via `application/x-www-form-urlencoded`
- [ ] Create `app/api/admin/fedex-shipment/route.ts` — verify admin, decrypt PII, validate country, get token, build payload, call `/ship/v1/shipments`
- [ ] Add `labelSpecification` block to payload — required or FedEx returns an error
- [ ] Extract tracking number from `output.transactionShipments[0].masterTrackingNumber`
- [ ] Call `OrderDAO.updateShipment()` to save tracking number as top level field
- [ ] Send shipping notification email
- [ ] Do NOT delete the order here — deletion is handled by the cron job after 24 hours

## Brevo Email

- [ ] Create account at brevo.com and verify sender email address
- [ ] `npm install @getbrevo/brevo`
- [ ] Add `BREVO_API_KEY`, `BREVO_FROM_EMAIL`, `BREVO_FROM_NAME`, `NEXT_PUBLIC_BASE_URL` to env
- [ ] Create `lib/mailer.ts` — init `TransactionalEmailsApi`, set API key
- [ ] Add `sendOrderConfirmation()` — called from Stripe webhook, include refund link
- [ ] Add `sendShippingNotification()` — called from FedEx shipment route and cron auto-ship job
- [ ] Add `sendRefundConfirmationEmail()` — called from refund approval route
- [ ] Add `sendDemoCompletionEmail()` — called from cron auto-delete job
- [ ] For any email that needs customer PII from MongoDB, decrypt with `safeDecrypt` before passing in
- [ ] Guard every email send with `if (customerEmail)` to handle decryption failures gracefully

## Refund Flow

- [ ] Add `refundToken: randomUUID()` and `refundStatus: "none"` to order document in Stripe webhook
- [ ] Declare `refundToken` and `orderId` outside the MongoDB transaction so they are in scope after it commits
- [ ] Add `findByRefundToken(token)` to `OrderDAO`
- [ ] Add `updateRefundStatus(orderId, status, reason?, note?)` to `OrderDAO`
- [ ] Create `app/refund-request/page.tsx` — server component, validate token, handle all four states
- [ ] Create `app/refund-request/RefundRequestForm.tsx` — client component, reason dropdown + notes textarea
- [ ] Create `app/api/refund-request/route.ts` — validate token again, guard against duplicate submissions, call `updateRefundStatus`
- [ ] Add refund link to confirmation email: `${baseUrl}/refund-request?token=${refundToken}&order=${orderId}`
- [ ] Add Refund column to admin orders table with badge and approve/reject buttons
- [ ] Create `app/api/admin/refund/[orderId]/route.ts` — verify admin, fetch order, call Stripe, send email, update status

## Auto-Ship + Auto-Delete Cron Job

- [ ] Generate cron secret: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- [ ] Add `CRON_SECRET` to `.env.local`
- [ ] Create `vercel.json` at root with `crons` schedule
- [ ] Create `app/api/cron/process-pending-orders/route.ts` with Job 1 (auto-ship) and Job 2 (auto-delete)
- [ ] Add `getOrdersNeedingAutoShip(cutoff)` to `OrderDAO`
- [ ] Add `getExpiredPendingOrders(cutoff)` to `OrderDAO`
- [ ] Add `deleteOrder(orderId)` to `OrderDAO`
- [ ] Add `updateShipment(orderId, trackingNumber)` to `OrderDAO`

---

---

# 🛡️ Protecting The Admin Dashboard

## 🧸 The Problem In Plain English

Imagine the admin dashboard is a room with a door.

Anyone can walk up to that door and try to open it — even people who shouldn't be there. They just type `/admin/dashboard` into the browser and try to walk in.

We need a **guard at the door** who checks every single person before they can enter. Every time. No exceptions.

---

## 🚪 What The Guard Checks

When someone tries to visit the dashboard, the guard does this — in order:

```
1. Do you have a cookie called admin_token?
        ↓ NO  → You are sent back to /admin/login immediately
        ↓ YES → Continue to next check

2. Is the cookie a real, signed JWT — not a fake?
        ↓ NO  → You are sent back to /admin/login immediately
        ↓ YES → Continue to next check

3. Has the cookie expired?
        ↓ YES → You are sent back to /admin/login immediately
        ↓ NO  → Continue to next check

4. Does the cookie say your role is "admin"?
        ↓ NO  → You are sent back to /admin/login immediately
        ↓ YES → You are allowed in ✅
```

---

## 📁 Where The Guard Lives

```
lib/verifyAdmin.ts
```

This one file IS the guard. It contains two functions:

```typescript
export async function verifyAdminPage()  // for server component pages
export async function verifyAdminApi()   // for API routes
```

---

## 🧠 What The Guard Does In Code

```typescript
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";

export async function verifyAdminPage() {
  const token = cookies().get("admin_token")?.value;
  if (!token) redirect("/admin/login");

  try {
    const payload = jwt.verify(token, process.env.ADMIN_JWT_SECRET!) as any;
    if (payload.role !== "admin") redirect("/admin/login");
    return payload;
  } catch {
    redirect("/admin/login");
  }
}
```

---

## 🏗️ How To Use It In A Protected Page

```typescript
// app/admin/dashboard/page.tsx
import { verifyAdminPage } from "@/lib/verifyAdmin";

export default async function DashboardPage() {
  await verifyAdminPage(); // one line — handles everything
  return <div>Welcome to the dashboard</div>;
}
```

---

## 🔒 What This Protects Against

| Attack | How The Guard Stops It |
|---|---|
| Someone types `/admin/dashboard` in the browser | No cookie → redirect |
| Someone pastes a made-up cookie | JWT signature check fails → redirect |
| Someone uses an old expired cookie | JWT expiry check fails → redirect |
| Someone edits their cookie in browser devtools | Signature no longer matches → redirect |
| A logged-in non-admin user | Role check fails → redirect |

---

## 🔁 How To Rebuild This In A New Project

- [ ] Create `lib/verifyAdmin.ts`
- [ ] Import `cookies` from `next/headers`, `redirect` from `next/navigation`, `jwt` from `jsonwebtoken`
- [ ] Write `verifyAdminPage()` — get cookie → verify JWT → check role → redirect or return payload
- [ ] Write `verifyAdminApi()` — same logic but returns a response instead of redirecting
- [ ] In every protected page, call `await verifyAdminPage()` as the very first line
- [ ] In every protected API route, call `verifyAdminApi(req)` before doing anything else
- [ ] Make sure `ADMIN_JWT_SECRET` is in your `.env.local`

---

## 🧠 The One Sentence That Explains All Of This

> Login proves who you are. The guard checks if you are still allowed inside. The guard checks every single time — not just once.

---

*Built with Next.js · MongoDB · Stripe · WebAuthn · @simplewebauthn v13 · Brevo · FedEx Sandbox · AES-256-GCM*
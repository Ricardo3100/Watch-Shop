# 🛍️ Watch Shop — Ecommerce with Accessible Design + Secure Admin

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

This project sends three transactional emails via the Brevo API:

| Email | Triggered by | Recipient |
|---|---|---|
| Order confirmation | Stripe webhook after payment | Customer |
| Shipping notification | Admin clicks ship button | Customer |
| Demo completion | Cron job after 24 hours | Customer |

---

## 🔑 How To Get Brevo Credentials

1. Create a free account at [brevo.com](https://brevo.com)
2. Go to **SMTP & API → API Keys**
3. Create a new API key
4. Add to `.env.local`:

```bash
BREVO_API_KEY=your_api_key
BREVO_FROM_EMAIL=your_verified_sender_email
BREVO_FROM_NAME=Watch Shop
```

> The `BREVO_FROM_EMAIL` must be a verified sender in your Brevo account.

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
```

> ⚠️ Do not use Zoho free tier SMTP for transactional email. Free Zoho plans block SMTP authentication. Use Brevo instead.

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
- [ ] Call `OrderDAO.updateShipment()` to save tracking number as top level field (`trackingNumber` not `shipping.tracking_number`)
- [ ] Send shipping notification email
- [ ] Do NOT delete the order here — deletion is handled by the cron job after 24 hours

## Brevo Email

- [ ] Create account at brevo.com and verify sender email
- [ ] `npm install @getbrevo/brevo`
- [ ] Add `BREVO_API_KEY`, `BREVO_FROM_EMAIL`, `BREVO_FROM_NAME` to env
- [ ] Create `lib/mailer.ts` — init `TransactionalEmailsApi`, set API key
- [ ] Add `sendOrderConfirmation()` — called from Stripe webhook
- [ ] Add `sendShippingNotification()` — called from FedEx shipment route and cron auto-ship job
- [ ] Add `sendDemoCompletionEmail()` — called from cron auto-delete job

## Auto-Ship + Auto-Delete Cron Job

- [ ] Generate cron secret: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- [ ] Add `CRON_SECRET` to `.env.local`
- [ ] Create `vercel.json` at root with `crons` schedule (`0 9 * * *` for daily at 9am UTC)
- [ ] Create `app/api/cron/process-pending-orders/route.ts` with two jobs:
  - Job 1 — auto-ship: finds orders older than 12hrs with no tracking number, calls FedEx, saves tracking number, sends shipping email
  - Job 2 — auto-delete: finds orders older than 24hrs, sends demo completion email, deletes full order
- [ ] Add `getOrdersNeedingAutoShip(cutoff: Date)` to `OrderDAO` — finds orders with `fulfillmentStatus: "pending"`, `createdAt < cutoff`, and `trackingNumber` not set
- [ ] Add `getExpiredPendingOrders(cutoff: Date)` to `OrderDAO` — finds all orders where `createdAt < cutoff` (no status filter — catches both shipped and pending)
- [ ] Add `deleteOrder(orderId)` to `OrderDAO` — deletes full order document
- [ ] Add `updateShipment(orderId, trackingNumber)` to `OrderDAO` — saves `trackingNumber` at top level, sets `fulfillmentStatus: "shipped"`

---

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

If you fail any step, you are out. The dashboard never loads.

---

## 📁 Where The Guard Lives

```
lib/verifyAdmin.ts
```

This one file IS the guard. It contains a single function:

```typescript
export async function verifyAdminPage()
```

---

## 🧠 What The Guard Does In Code

```typescript
// lib/verifyAdmin.ts

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";

export async function verifyAdminPage() {
  // Step 1 — Get the cookie
  const token = cookies().get("admin_token")?.value;

  // Step 2 — No cookie? Leave immediately
  if (!token) redirect("/admin/login");

  try {
    // Step 3 — Check if the JWT is real and not expired
    const payload = jwt.verify(token, process.env.ADMIN_JWT_SECRET!) as any;

    // Step 4 — Check if the role is "admin"
    if (payload.role !== "admin") redirect("/admin/login");

    // Step 5 — Everything passed, return the admin info
    return payload;

  } catch {
    // JWT was fake, tampered with, or expired
    redirect("/admin/login");
  }
}
```

---

## 🏗️ How To Use It In A Protected Page

Before this existed, every protected page had its own copy of the JWT checking code. That meant:
- The same code in 5 places
- If you change auth later, you have to update 5 places
- Easy to forget one and leave a page unprotected

Now every protected page does just this:

```typescript
// app/admin/dashboard/page.tsx

import { verifyAdminPage } from "@/lib/verifyAdmin";

export default async function DashboardPage() {

  // This one line does ALL the checking
  const admin = await verifyAdminPage();

  // If you reach this line, the person is definitely the admin
  // The redirect already happened if they weren't

  return (
    <div>
      <h1>Welcome to the dashboard</h1>
    </div>
  );
}
```

That is the whole thing. One line. The guard handles everything else.

---

## 🔁 Why One File Is Better Than Many

Think of it like a key card machine at an office.

You could put a separate lock on every single door with its own combination. But then:
- You have to remember 10 combinations
- Changing the security means changing 10 locks
- You will forget to update one

Or you could have one key card machine that every door uses. Change the machine once, all doors update automatically.

`lib/verifyAdmin.ts` is the key card machine.

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
- [ ] In every protected page, call `const admin = await verifyAdminPage()` as the very first line
- [ ] In every protected API route, call the same function before doing anything else
- [ ] Make sure `ADMIN_JWT_SECRET` is in your `.env.local`

---

## 🧠 The One Sentence That Explains All Of This

> Login proves who you are. The guard checks if you are still allowed inside. The guard checks every single time — not just once.

---

*Built with Next.js · MongoDB · Stripe · WebAuthn · @simplewebauthn v13*
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
To test connection to mongo db use this file path ; http://localhost:3000/api/Mongo-DB/test-db-connection


## License & Usage

This project is licensed under the MIT License.

**Intended use:**  
This repository is primarily for **personal learning**, demonstrating **accessible coding pipelines**, and showcasing code during **interviews or screen shares**.  

While the MIT License allows others to copy, modify, and distribute the code, please note that this project is **not intended for commercial use** without prior permission.

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

# WebAuthn (Passkey Login)
WEBAUTHN_ORIGIN=http://localhost:3000
WEBAUTHN_RP_ID=localhost
WEBAUTHN_RP_NAME=Watch Shop Admin

# Admin Session
ADMIN_JWT_SECRET=your_long_random_secret_here

# MongoDB
MONGODB_URI=mongodb+srv://...
Mongo_DB_Name=your_database_name
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

# WebAuthn (Passkey Login)
WEBAUTHN_ORIGIN=http://localhost:3000
WEBAUTHN_RP_ID=localhost
WEBAUTHN_RP_NAME=Watch Shop Admin

# Admin Session
ADMIN_JWT_SECRET=your_long_random_secret_here

# MongoDB
MONGODB_URI=mongodb+srv://...
Mongo_DB_Name=your_database_name
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

__________________________________________________________________________________________

Shipping This app will use the fed ex api to simulate tracking and shipping flow. 
1. in the developer portal create an organization
2. select "Fed Ex Shipper" and fill out the form
3. create an organization
4. create a project
5. select the ship api option

APi's I selected for this project were: Address Validation API
Comprehensive Rates and Transit Times API
FedEx Locations Search API
Pickup Request API
Postal Code Validation API
Ship API

You will need to provid these values in the env file one fo rlocal testing 
and the production values once the  product is ready for production

FEDEX_CLIENT_ID=your_sandbox_client_id
FEDEX_CLIENT_SECRET=your_sandbox_client_secret
FEDEX_ACCOUNT_NUMBER=your_fedex_account_number
FEDEX_API_URL=https://apis-sandbox.fedex.com

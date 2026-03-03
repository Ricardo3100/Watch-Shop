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

 Stripe Payments — Baby Version (Rebuild From Nothing Guide)

Imagine this:

A customer wants to give you money.

You cannot touch their card.

Stripe is the trusted adult in the room.

Your job is just to:

Tell Stripe how much money.

Let Stripe collect the card.

Ask Stripe to finish the payment.

That’s it.

Everything in this folder exists to do those 3 things.

Big Picture First (So You Don’t Get Lost)

When someone clicks “Pay”, this happens:

Your server says:

“Stripe, I want to charge $240.”

Stripe says:

“Okay. Here’s a secret code for that payment.”

Your browser uses that secret code to safely collect card details.

Stripe charges the card.

Stripe sends the user to the success page.

That’s the whole system.

If anything breaks, it’s because one of those 5 steps broke.

The Two Worlds

There are two worlds in this app:

World 1: Server (safe world)
World 2: Browser (unsafe world)

Important rule:

The browser is not trusted.

The server is trusted.

Money math must happen in the trusted world.

Step 1 — The Secret Keys (The Keys to the House)

Stripe gives you two keys.

They look like this:

Public key:

pk_test_...


Secret key:

sk_test_...


Public key:

Goes in the browser

Safe to show

Secret key:

ONLY on the server

If leaked, someone can charge cards

So we store them in .env.local.

If Stripe says:

“Publishable key undefined”

It means your public key is missing or misspelled.

Step 2 — The Most Important File

createPaymentIntent.ts

This is the brain.

This file runs on the server.

Its job is:

Look at the cart.

Add up the total.

Multiply by 100 (Stripe wants cents).

Ask Stripe to create a PaymentIntent.

Return the secret code.

Example:

"use server";

import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function createPaymentIntent(cartItems) {

  // Step 1: Add up money
  const total = cartItems.reduce((acc, item) => {
    return acc + item.price * item.quantity;
  }, 0);

  // Step 2: Convert dollars to cents
  const amount = Math.round(total * 100);

  // Step 3: Tell Stripe
  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: "usd",
    automatic_payment_methods: { enabled: true },
  });

  // Step 4: Give browser the secret
  return paymentIntent.client_secret;
}


If Stripe dashboard shows wrong amount:

It is because THIS math is wrong.

Not Stripe.

Always check this file first.

Step 3 — Why Multiply by 100?

Stripe speaks cents.

You speak dollars.

$240.00
Stripe wants 24000.

If you forget this:
Your payment will be wrong.

Step 4 — The Browser Needs Permission

Stripe does not let the browser collect card info without permission.

The permission is the client_secret.

That secret says:

“This browser is allowed to complete THIS specific payment.”

Without it, nothing works.

That is why we must:

Call createPaymentIntent

Save the returned secret

Pass it into <Elements>

Step 5 — Stripe Wrapper

Stripe requires this:

<Elements stripe={...} options={{ clientSecret }}>
   <CheckoutForm />
</Elements>


Why?

Because Stripe injects magic into everything inside <Elements>.

If you remove it:

useStripe() will be null

PaymentElement won’t work

Confirm payment fails

This wrapper is not optional.

Step 6 — The Checkout Form

This is the only thing the user sees.

<PaymentElement />


That component:

Shows card input

Handles validation

Handles fraud

Handles 3D secure

Sends card data directly to Stripe

Your server NEVER sees the card.

Then this runs:

stripe.confirmPayment({
  elements,
  confirmParams: {
    return_url: "/success"
  }
});


That line means:

“Stripe, finish the payment now.”

That’s it.

You are not charging manually.
Stripe is.

Step 7 — The Success Page

When payment is done, Stripe redirects to:

/success


This page should:

Clear the cart

Show confirmation message

If you don’t clear cart:
User might accidentally pay again.

If Something Breaks

If clicking pay does nothing:

StripeWrapper missing

clientSecret not loaded

If amount wrong:

createPaymentIntent math wrong

Forgot * 100

Cart was empty when intent created

If publishable key undefined:

Missing NEXT_PUBLIC_

If payment shows incomplete:

You didn’t use Stripe test card

The Entire Flow in One Sentence

Server creates payment.
Browser completes payment.
Stripe processes payment.

That’s it.

If You Rebuild This In 10 Years

Do exactly this:

Install stripe packages.

Add env keys.

Create server function to create PaymentIntent.

Calculate money on server.

Multiply by 100.

Return client_secret.

Wrap checkout in <Elements>.

Render <PaymentElement />.

Call stripe.confirmPayment().

Create success page.

Clear cart.

If you follow those 11 steps, Stripe works.

Every time.

The Only Three Rules That Matter

Never trust frontend for money.

Always multiply by 100.

Never expose secret key.

If you remember those three, you will never break Stripe.
-----------------------------------
Why a Webhook Is Required

When using Stripe Elements, payment confirmation happens on the frontend.
However, the frontend cannot be trusted as the source of truth.

For that reason, this project uses a Stripe webhook to:

Confirm that payment_intent.succeeded actually occurred

Retrieve trusted shipping information from the PaymentIntent

Atomically reduce product inventory

Create the order in MongoDB

Prevent duplicate orders

The webhook acts as the secure backend authority for order creation.

Shipping Information Flow

User enters shipping details in a custom form

Server attaches shipping data to the PaymentIntent

Stripe confirms payment

Webhook receives payment_intent.succeeded

Shipping data is read from Stripe

Order is created in the database

This ensures that shipping data is only stored after a successful payment.
 --------------------
 <!-- How to install the cli locally -->
 In order to test this you will first need to download the stripe cli locally
 <!-- step 1 run this curl command in the terminal -->
 curl -s https://packages.stripe.dev/api/security/keypair/stripe-cli-gpg/public | gpg --dearmor | sudo tee /usr/share/keyrings/stripe.gpg

 <!-- step 2 run this command in the terminal -->
echo "deb [signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.dev/stripe-cli-debian-local stable main" | sudo tee -a /etc/apt/sources.list.d/stripe.list
<!-- step 3 run this comand in terminal  -->
sudo apt update
<!-- step 4 run  this command in the terminal -->
sudo apt install stripe

<!-- step 5 run this ommand in terminal -->
stripe login
<!-- step 6 press enter  you will get a generic project name -->
Your pairing code is: some-pairing-code-name
This pairing code verifies your authentication with Stripe.
Press Enter to open the browser or visit https://dashboard.stripe.com/stripecli/confirm_auth?t=THQdJfL3x12udFkNorJL8OF1iFlN8Az1 (^C to quit)

<!-- step 7 you will be asked to connect the account to the cli client this is where you need to make sure you connect it to the right one or testing wont work my testiing originally failed de to connecting it to the personal one instead of the one named "watchshop" -->

<!-- How to test stripe locally -->
you will need to run the following command in the terminal : stripe listen --forward-to localhost:3000/path-to-the-web-hook/

for example this project has the webhook in the stripe-api folder within the api folder so the command to run it for this project  is : stripe listen --forward-to localhost:3000/api/stripe-webhook because that is the folder path where the web hook is at.

 both the stripe command and the local host must be running for the local test to work.

 <!-- Password hashing -->
 is handled by bcrypt install it by running the following command in the terminal : npm install bcryptjs

 to start you can generate a secure code by typing 
 node into a terminal and then running the following command : const bcrypt = require("bcryptjs");
bcrypt.hashSync("YourVeryStrongAdminPassword", 12); this will generate  random password which you can put into your env file

you also need to install jsonwebtoken via npm i jsonwebtoken


## Admin Authentication (Passwordless)

This project implements WebAuthn passkey authentication.

Flow:
1. Admin registers a passkey.
2. Public key is stored in MongoDB.
3. Login requires cryptographic challenge verification.
4. On success, a short-lived JWT is issued via HTTP-only secure cookie.
5. Middleware protects all /admin routes.

Security:
• No stored passwords
• Phishing-resistant authentication
• JWT expiration (2h)
• Secure cookies (HTTP-only, SameSite=Strict)

run npm install @simplewebauthn/server @simplewebauthn/browser
<!-- how to generage a jwt token -->
run this command in a terminal : node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

copy the resulting hex code into the env file


Admin Passkey Authentication (WebAuthn)
Overview

This project implements passwordless admin authentication using:

@simplewebauthn/server

@simplewebauthn/browser

MongoDB

JWT session cookies

Only admin users can access protected routes.

Authentication flow:

Admin registers a passkey

Credential is stored in MongoDB

Admin logs in using biometric/device authentication

Server verifies assertion

JWT session is issued

📁 File Structure
app/
 ├─ admin/
 │   ├─ register/page.tsx
 │   ├─ login/page.tsx
 │   └─ layout.tsx
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
🧠 What Each File Does
registration-challenge/route.ts

Purpose:
Generates a WebAuthn registration challenge.

Uses:

generateRegistrationOptions()

Key configuration:

rpName → Application name

rpID → Domain (localhost in development)

userID → Uint8Array identifier

userName → Admin username

Returns challenge options to the browser.

registration-verify/route.ts

Purpose:
Verifies the registration response from the browser.

Uses:

verifyRegistrationResponse()

If valid:

Extracts credential ID

Stores public key

Stores counter

Saves to MongoDB

This creates the admin credential record.

authentication-challenge/route.ts

Purpose:
Generates a login challenge.

Uses:

generateAuthenticationOptions()

Includes:

Registered credential ID

rpID

challenge

Sent to browser for login attempt.

authentication-verify/route.ts

Purpose:
Verifies login attempt.

Uses:

verifyAuthenticationResponse()

If valid:

Confirms signature

Validates counter

Issues JWT session cookie

admin/layout.tsx

Purpose:
Protects admin routes.

Checks:

JWT cookie

Valid signature

Admin flag

If invalid:

redirect("/")
🔐 Environment Variables

.env.local

WEBAUTHN_RP_NAME=My Admin Panel
WEBAUTHN_RP_ID=localhost
JWT_SECRET=your_super_long_random_secret_here
Mongo_DB_Name=your_database_name
🔑 Generating a JWT Secret

Run in terminal:

node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

Copy result into:

JWT_SECRET=
🗄 MongoDB Credential Structure

Example document:

{
  "userId": "admin-id",
  "credentialID": "...",
  "publicKey": "...",
  "counter": 0
}
🔄 Registration Flow (Step-by-Step)

Admin clicks “Register Passkey”

Frontend calls:

/api/admin/registration-challenge

Server returns challenge

Browser prompts biometric/device

Frontend sends response to:

/api/admin/registration-verify

Server verifies and stores credential

🔄 Authentication Flow

Admin clicks “Login”

Frontend calls:

/api/admin/authentication-challenge

Server sends challenge

Browser prompts biometric

Frontend sends response to:

/api/admin/authentication-verify

Server verifies

JWT cookie issued

Admin layout allows access

🛡 Why This Is Secure

No passwords stored

No password hashing required

Private keys never leave the device

Public key stored in DB

Replay attack protection via counter

JWT signed server-side

🧱 Why This Is Good for Ecommerce Baseline

This pattern gives you:

Reusable admin authentication

Hardware-backed security

Production-ready passkey flow

Easily extendable to:

Multiple admins

Role-based access

Customer accounts

2FA layers

This is significantly stronger than bcrypt-only admin auth.

🚀 Next Logical Step

Now that registration works:

You should build:

Authentication challenge + verify routes

Then test full login → protected layout → redirect flow.

After that:

Encrypt order addresses

Add field-level encryption

Add audit logging

Harden cookies

You’re building this correctly.

When you’re ready, say:

Admin Passkey Authentication (WebAuthn)

Our watch ecommerce shop uses hardware-backed passkeys for admin login instead of passwords. This provides strong protection against phishing, credential stuffing, and brute-force attacks.

Features

Admin login uses WebAuthn (passkeys) instead of traditional passwords

Hardware-backed security via device authenticators (TouchID, Windows Hello, security keys)

Credential info stored in MongoDB:

credentialID – Base64url string identifying the credential

publicKey – Authenticator public key (Binary)

counter – Numeric signature counter to prevent replay attacks

Authentication flow issues a challenge that must be signed by the authenticator

Verified responses update the counter in MongoDB for security

Flow Overview

Registration

Admin triggers registration-challenge → server issues challenge

Browser displays passkey popup (navigator.credentials.create)

Registration response sent to registration-verify

Server stores credentialID, publicKey, counter in MongoDB

Authentication

Admin triggers authentication-challenge → server issues challenge

Browser displays passkey login popup (navigator.credentials.get)

Authentication response sent to authentication-verify

Server:

Looks up credential by credentialID

Converts publicKey to Uint8Array

Passes response to @simplewebauthn/server for verification

Updates counter in MongoDB

Returns success/failure

Security Notes

No passwords stored or transmitted

Counter prevents replay attacks

Challenges are one-time use

Only admin credentials can authenticate to /admin endpoints

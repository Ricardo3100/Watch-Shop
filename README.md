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


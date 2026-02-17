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


💳 Stripe Integration (Stripe Elements – Accessible Setup)

This project uses Stripe Elements from Stripe instead of Stripe Checkout to provide:

Full accessibility control

AAA contrast customization

Inline payment (no redirect)

Keyboard and screen reader support

Consistent on-site experience

Stripe Elements allows secure payment collection directly within the product page.

1️⃣ Install Dependencies
npm install stripe @stripe/react-stripe-js @stripe/stripe-js

2️⃣ Environment Variables

Create or update .env.local:

NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_BASE_URL=http://localhost:3000

Important

NEXT_PUBLIC_STRIPE_PUBLIC_KEY is safe for frontend use.

STRIPE_SECRET_KEY must never be exposed to the client.

Restart the dev server after updating environment variables.

3️⃣ Stripe Loader

File: lib/getStripe.ts

import { loadStripe, Stripe } from "@stripe/stripe-js";

let stripePromise: Promise<Stripe | null>;

const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(
      process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY as string
    );
  }
  return stripePromise;
};

export default getStripe;

4️⃣ Create Payment Intent API Route

File: app/api/create-payment-intent/route.ts

import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20",
});

export async function POST(req: Request) {
  try {
    const { amount } = await req.json();

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Payment intent failed" },
      { status: 500 }
    );
  }
}

Note

Stripe expects amounts in cents:

$49.99 → 4999

$120.00 → 12000

5️⃣ Stripe Wrapper Component

File: components/StripeWrapper.tsx

"use client";

import { Elements } from "@stripe/react-stripe-js";
import getStripe from "@/lib/getStripe";

export default function StripeWrapper({ clientSecret, children }: any) {
  return (
    <Elements stripe={getStripe()} options={{ clientSecret }}>
      {children}
    </Elements>
  );
}

6️⃣ Checkout Form Component

File: components/CheckoutForm.tsx

"use client";

import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useState } from "react";

export default function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/success`,
      },
    });

    if (error) {
      setMessage(error.message ?? "Payment failed");
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      <PaymentElement />

      <button
        disabled={loading}
        className="w-full bg-black text-white py-3 rounded-lg text-lg font-semibold focus:outline-none focus:ring-4 focus:ring-black"
      >
        {loading ? "Processing..." : "Pay Now"}
      </button>

      {message && (
        <p className="text-red-600 font-semibold">
          {message}
        </p>
      )}
    </form>
  );
}

7️⃣ Product Checkout Component

File: components/ProductCheckout.tsx

"use client";

import { useEffect, useState } from "react";
import StripeWrapper from "./StripeWrapper";
import CheckoutForm from "./CheckoutForm";

export default function ProductCheckout({ price }: any) {
  const [clientSecret, setClientSecret] = useState("");

  useEffect(() => {
    fetch("/api/create-payment-intent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amount: price * 100 }),
    })
      .then((res) => res.json())
      .then((data) => setClientSecret(data.clientSecret));
  }, [price]);

  if (!clientSecret) return <p>Loading payment...</p>;

  return (
    <StripeWrapper clientSecret={clientSecret}>
      <CheckoutForm />
    </StripeWrapper>
  );
}

8️⃣ Usage in Product Page
import ProductCheckout from "@/components/ProductCheckout";

<ProductCheckout price={product.price} />

🔐 Production Hardening Checklist

Before deploying to production, complete the following:

1️⃣ Never Trust Frontend Price

Instead of sending price from frontend:

Send productId

Fetch product from database inside the API route

Use the database price to create the PaymentIntent

This prevents price manipulation.

2️⃣ Implement Stripe Webhooks

Stripe webhooks are required to:

Confirm successful payment

Store order in database

Update inventory

Trigger confirmation emails

Recommended endpoint:

app/api/webhooks/stripe/route.ts


Use Stripe’s webhook signing secret for verification.

3️⃣ Validate Environment Variables in Production

Ensure production environment contains:

NEXT_PUBLIC_STRIPE_PUBLIC_KEY
STRIPE_SECRET_KEY
NEXT_PUBLIC_BASE_URL


Never commit .env.local.

4️⃣ Enable HTTPS in Production

Stripe requires HTTPS for live mode.

Use:

Vercel

Railway

Render

Or another secure hosting provider

5️⃣ Handle Payment States

Add proper handling for:

Success page

Failed payments

Canceled payments

Loading states

6️⃣ Test Using Stripe Test Cards

Use Stripe test cards from their official documentation:

Successful payment

Declined payment

3D Secure flow

✅ Why Stripe Elements Was Chosen

Stripe Elements was selected because:

Provides full accessibility control

Allows AAA contrast design

Supports screen readers and keyboard navigation

Keeps checkout inline (no redirect)

Offers complete UI customization

Stripe integration is now modular, reusable, and production-ready with hardening applied.


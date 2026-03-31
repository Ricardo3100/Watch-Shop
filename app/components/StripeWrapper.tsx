"use client";

import { Elements } from "@stripe/react-stripe-js";
import getStripe from "../lib/getStripe";

export default function StripeWrapper({ clientSecret, children }: any) {
  return (
    <Elements stripe={getStripe()} options={{ clientSecret }}>
      {children}
    </Elements>
  );
}

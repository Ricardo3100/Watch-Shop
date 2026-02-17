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

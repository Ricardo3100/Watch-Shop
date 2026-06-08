"use client";

import { useEffect, useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useStateContext } from "../context/statecontext";
import { createPaymentIntent } from "../server-actions-utils/create-payment-intent";
import CheckoutForm from "../components/CheckOutForm";


export default function Disclaimer() {

  return (
    <div>
      <div className="bg-blue-900 text-white p-4 rounded-lg mb-6">
        <strong>Demo Environment:</strong> This is a training project. No real
        payments are processed and no orders will be shipped.
 This site is intentionally built with accessibility issues such as no focus rings, no dymanic live regions just to name a few issues, so that automated testing can catch these issues and flag those problems before the problems reach production.
 These issues will be resolved once the project is complete.      </div>
  
    </div>
  );
}

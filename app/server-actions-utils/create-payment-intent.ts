"use server";

import Stripe from "stripe";
import  productDAO  from "../api/Mongo-DB/dataaccessobject/productdao";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function createPaymentIntent(

  

  
 cartItems: any[],
  shipping: any
) {


const productIds = cartItems.map((item) => item._id);

const products = await productDAO.getByIds(productIds);


let total = 0;

for (const item of cartItems) {
  const product = products.find((p) => p._id.toString() === item._id);

  if (!product) {
    throw new Error("Product not found");
  }
// we calculate the total here to ensure 
// it's correct and matches what will be 
// charged by Stripe. This is important for 
// data integrity and to prevent any 
// discrepancies between the order total 
// and the payment amount.
  total += product.price * item.quantity;
}

const minimalCart = cartItems.map((item) => ({
  _id: item._id,
  quantity: item.quantity,
}));
const paymentIntent = await stripe.paymentIntents.create({
  amount: total * 100,
  // reciept_email is a convenient way to
  //  ensure we have the customer's email i
  // n the PaymentIntent, which can be
  // useful for sending receipts and for our webhook processing.
  //  We also include it in metadata as a fallback.
  receipt_email: shipping.email,
  currency: "usd",
  automatic_payment_methods: { enabled: true },

  metadata: {
    email: shipping.email,
    cart: JSON.stringify(minimalCart),
  },
  // we include shipping details in the
  //  PaymentIntent so that we have
  // this information
  shipping: {
    name: shipping.fullName,

    address: {
      line1: shipping.line1,
      city: shipping.city,
      state: shipping.state,
      postal_code: shipping.postalCode,
      country: shipping.country,
    },
  },
});


  return paymentIntent.client_secret;
}

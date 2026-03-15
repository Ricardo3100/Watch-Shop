import { redirect } from "next/navigation";
import OrderDAO from "../../Mongo-DB/dataaccessobject/orderdao";
import RefundRequestForm from "./refundrequestform";

export default async function RefundRequestPage({   
  searchParams,
}: {
  searchParams: { token?: string; order?: string };
}) {
  const { token, order } = searchParams;

  // Missing token or order id in URL
  if (!token || !order) {
    return (
      <div style={{ fontFamily: "Arial, sans-serif", maxWidth: 600, margin: "80px auto", padding: "0 20px" }}>
        <h1 style={{ fontSize: 24, fontWeight: "bold" }}>Invalid link</h1>
        <p style={{ color: "#666" }}>
          This refund link is invalid or has expired. Please reply to your order
          confirmation email if you need help.
        </p>
      </div>
    );
  }

  // Validate token against DB
  const orderDoc = await OrderDAO.findByRefundToken(token);

  if (!orderDoc || orderDoc._id.toString() !== order) {
    return (
      <div style={{ fontFamily: "Arial, sans-serif", maxWidth: 600, margin: "80px auto", padding: "0 20px" }}>
        <h1 style={{ fontSize: 24, fontWeight: "bold" }}>Invalid link</h1>
        <p style={{ color: "#666" }}>
          This refund link is invalid or has expired. Please reply to your order
          confirmation email if you need help.
        </p>
      </div>
    );
  }

  // Already submitted
  if (orderDoc.refundStatus === "requested") {
    return (
      <div style={{ fontFamily: "Arial, sans-serif", maxWidth: 600, margin: "80px auto", padding: "0 20px" }}>
        <h1 style={{ fontSize: 24, fontWeight: "bold" }}>Already submitted ✅</h1>
        <p style={{ color: "#666" }}>
          We already have your refund request and will be in touch shortly.
        </p>
      </div>
    );
  }

  // Already approved or rejected
  if (orderDoc.refundStatus === "approved" || orderDoc.refundStatus === "rejected") {
    return (
      <div style={{ fontFamily: "Arial, sans-serif", maxWidth: 600, margin: "80px auto", padding: "0 20px" }}>
        <h1 style={{ fontSize: 24, fontWeight: "bold" }}>Request already processed</h1>
        <p style={{ color: "#666" }}>
          Your refund request has already been{" "}
          {orderDoc.refundStatus === "approved" ? "approved" : "reviewed"}.
          Please reply to your order confirmation email if you have further questions.
        </p>
      </div>
    );
  }

  // Valid — show form
  return (
    <RefundRequestForm
      orderId={order}
      token={token}
    />
  );
}
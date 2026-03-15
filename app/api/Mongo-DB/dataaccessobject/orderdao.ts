import clientPromise from "../mongodb";
import { ObjectId } from "mongodb"; 

export default class OrderDAO {
  private static async collection() {
    const dbName = process.env.Mongo_DB_Name;

    if (!dbName) {
      throw new Error("Please define the Mongo_DB_Name environment variable");
    }

    const client = await clientPromise;
    const db = client.db(dbName);

    return db.collection("orders");
  }

  static async findByPaymentIntent(paymentIntentId: string) {
    const collection = await this.collection();
    return await collection.findOne({
      stripePaymentIntentId: paymentIntentId,
    });
  }

  static async createOrder(order: any, session: any) {
    const collection = await this.collection();
    return await collection.insertOne(order, { session });
  }

  static async findById(orderId: string) {
    const collection = await this.collection();
    return await collection.findOne({ _id: new ObjectId(orderId) }); // ✅ ObjectId not Object
  }

  static async findByRefundToken(token: string) {
    const collection = await this.collection();

    // DEBUG
    console.log("searching for token:", token);
    console.log("db name:", process.env.Mongo_DB_Name);
    const count = await collection.countDocuments();
    console.log("total docs in collection:", count);
    const sample = await collection.findOne({});
    console.log("sample doc fields:", sample ? Object.keys(sample) : "no docs");

    console.log("stored refundToken:", sample?.refundToken); // ← add this
    console.log("stored _id:", sample?._id.toString()); // ← add this
    return await collection.findOne({ refundToken: token });
  }

  static async updateRefundStatus(
    orderId: string,
    status: "requested" | "approved" | "rejected",
    reason?: string,
    note?: string,
  ) {
    const collection = await this.collection();
    return await collection.updateOne(
      { _id: new ObjectId(orderId) },
      {
        $set: {
          refundStatus: status,
          ...(reason && { refundReason: reason }),
          ...(note && { refundNote: note }),
          refundRequestedAt: new Date(),
        },
      },
    );
  }
  static async updateShipment(orderId: string, trackingNumber: string) {
    const collection = await this.collection();
    return await collection.updateOne(
      { _id: new ObjectId(orderId) },
      {
        $set: {
          trackingNumber: trackingNumber, // ✅ top level field now
          fulfillmentStatus: "shipped",
          shippedAt: new Date(),
        },
      },
    );
  }

  static async getPendingOrders(limit = 50) {
    const collection = await this.collection();
    return await collection
      .find({ fulfillmentStatus: "pending" })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
  }

  static async getCompletedOrders(limit = 50) {
    const collection = await this.collection();
    return await collection
      .find({ paymentStatus: "paid" }) // ✅ was: status: "paid"
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
  }
  // Deletes the full order document from MongoDB.
  // Called in two places:
  // 1. FedEx shipment route — after shipping email fires
  // 2. Cron job — after 24 hours if admin never shipped
  // After this runs nothing remains in MongoDB for this order.
  static async deleteOrder(orderId: string) {
    const collection = await this.collection();
    await collection.deleteOne({ _id: new ObjectId(orderId) });
    console.log(`Full order deleted: ${orderId}`);
  }
  // Find orders that need to be auto-deleted by the cron job.
  // These are orders that:
  // - Are older than 24 hours (admin had time to ship manually)
  // - Still have fulfillmentStatus: "pending"
  // We do NOT filter by trackingNumber here because
  // some orders might have been shipped manually before FedEx integration
  static async getExpiredPendingOrders(cutoff: Date) {
    const collection = await this.collection();
    return await collection
      .find({
        createdAt: { $lt: cutoff }, // ✅ removed fulfillmentStatus filter
      })
      .toArray();
  }
  // Find orders that need to be auto-shipped by the cron job.
  // These are orders that:
  // - Are older than 12 hours (admin had time to ship manually)
  // - Still have fulfillmentStatus: "pending"
  // - Have no tracking number yet (FedEx was never called)
  static async getOrdersNeedingAutoShip(cutoff: Date) {
    const collection = await this.collection();
    return await collection
      .find({
        fulfillmentStatus: "pending",
        createdAt: { $lt: cutoff },
        trackingNumber: { $exists: false },
      })
      .toArray();
  }
}

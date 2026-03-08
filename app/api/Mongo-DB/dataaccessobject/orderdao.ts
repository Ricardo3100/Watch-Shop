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

  static async updateShipment(orderId: string, trackingNumber: string) {
    const collection = await this.collection();
    return await collection.updateOne(
      { _id: new ObjectId(orderId) },
      {
        $set: {
          "shipping.tracking_number": trackingNumber,
          fulfillmentStatus: "shipped", // ✅ was: status: "shipped"
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
  // Find all orders that:
  // - Were created more than 24 hours ago
  // - Still have fulfillmentStatus: "pending"
  // - Admin never manually shipped them
  // Used by the cron job to auto-process stale orders.
  static async getExpiredPendingOrders(cutoff: Date) {
    const collection = await this.collection();
    return await collection
      .find({
        fulfillmentStatus: "pending",
        createdAt: { $lt: cutoff },
      })
      .toArray();
  }
}

import clientPromise from "../mongodb";
import { ObjectId } from "mongodb"; // ✅ add this import

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
}

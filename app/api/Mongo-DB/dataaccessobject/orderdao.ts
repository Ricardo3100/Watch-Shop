import clientPromise from "../mongodb";
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
      // this method checks if an order 
      // with the given Stripe P
      // aymentIntent ID already exists in the database.
      stripePaymentIntentId: paymentIntentId,
    });
  }

  static async createOrder(order: any, session: any) {
    const collection = await this.collection();
// this method creates a new order
//  document in the "orders" collection. 
// It takes an order object and a MongoDB 
// session as parameters. The session is 
// used to ensure that the order 
// creation is part of a transaction, allowing
//  for atomic operations when combined
//  with other database actions (like 
// updating product stock). 
// The method returns the result of
//  the insert operation, which includes 
// details about the newly created order document.
    return await collection.insertOne(order, { session });
  }
}

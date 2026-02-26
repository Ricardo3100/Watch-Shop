// Import the MongoDB client connection we created in /lib/mongodb
import clientPromise from "../mongodb";

// ObjectId is needed when querying by _id
import { ObjectId } from "mongodb";

/**
 * Product Interface
 *
 * This replaces a Mongoose schema.
 * Since we are not using Mongoose, TypeScript
 * is what gives us structure and type safety.
 *
 * MongoDB itself is schema-less unless configured otherwise,
 * so this interface acts as our application-level schema.
 */
export interface Product {
  category: string; 
  image: string;
  name: string;
  price: number;
  stock: number;
  description: string;

  // These are manually handled since we are not using
  // Mongoose's { timestamps: true }
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * ProductDAO
 *
 * DAO = Data Access Object
 *
 * This class is responsible ONLY for database operations.
 *
 * It does NOT:
 * - Handle HTTP requests
 * - Contain business logic
 * - Validate complex rules
 *
 * It ONLY talks to MongoDB.
 */
export default class ProductDAO {
  /**
   * Private helper method to get the products collection.
   *
   * Why we do this:
   * - Keeps DB access centralized
   * - Prevents repeating connection logic
   * - Makes future refactoring easier
   */
  private static async collection() {
    // Step 1: Read DB name from env
    const dbName = process.env.Mongo_DB_Name;
    if (!dbName) {
      throw new Error("Please define the Mongo_DB_NAME environment variable");
    }

    // Step 2: Get the Mongo client
    const client = await clientPromise;

    // Step 3: Get the database object
    const db = client.db(dbName);

    // Step 4: Return the collection
    return db.collection<Product>("products");
  }

  /**
   * Create a new product in the database.
   *
   * This mimics:
   *   Mongoose -> Product.create()
   *
   * Since we do not have schema validation,
   * we manually ensure required fields exist.
   */
  static async create(product: Product) {
    const collection = await this.collection();

    // Manual "required: true" validation
    if (
      !product.image ||
      !product.name ||
      product.price === undefined ||
      product.stock === undefined ||
      !product.description
    ) {
      throw new Error("Missing required product fields");
    }

    // Manually implement timestamps (like Mongoose does)
    const now = new Date();

    const result = await collection.insertOne({
      ...product,
      createdAt: now,
      updatedAt: now,
    });

    return result;
  }

  /**
   * Get all products.
   *
   * Equivalent to:
   *   Mongoose -> Product.find()
   */
  static async getAll() {
    const collection = await this.collection();

    const products = await collection.find({}).toArray();

    return products.map((product: any) => ({
      ...product,
      _id: product._id.toString(),
      createdAt: product.createdAt?.toISOString?.() || product.createdAt,
      updatedAt: product.updatedAt?.toISOString?.() || product.updatedAt,
    }));
  }

  /**
   * Get a single product by its MongoDB _id.
   *
   * IMPORTANT:
   * MongoDB _id is an ObjectId, not a string.
   * So we convert the string into ObjectId.
   */
  static async getById(id: string) {
    const collection = await this.collection();

    return await collection.findOne({
      _id: new ObjectId(id),
    });
  }
  static async atomicDecreaseStock(
    productId: string,
    quantity: number,
    session: any,
  ) {
    const collection = await this.collection();

    const result = await collection.updateOne(
      {
        _id: new ObjectId(productId),
        stock: { $gte: quantity },
      },
      {
        $inc: { stock: -quantity },
        $set: { updatedAt: new Date() },
      },
      { session },
    );

    return result.modifiedCount === 1;
  }

  static async getByIds(ids: string[]) {
    const collection = await this.collection();

    const objectIds = ids.map((id) => new ObjectId(id));

    return await collection.find({ _id: { $in: objectIds } }).toArray();
  }

  /**
   * Update product stock.
   *
   * $inc allows us to increment/decrement a numeric field.
   *
   * This is useful for e-commerce when:
   * - An order is placed
   * - Inventory is reduced
   */
  static async updateStock(id: string | ObjectId, quantity: number) {
    const collection = await this.collection();

    const objectId = typeof id === "string" ? new ObjectId(id) : id;

    return await collection.updateOne(
      { _id: objectId },
      {
        $inc: { stock: -quantity },
        $set: { updatedAt: new Date() },
      },
    );
  }

  /**
   * Delete a product by ID.
   *
   * Equivalent to:
   *   Mongoose -> Product.findByIdAndDelete()
   */
  static async delete(id: string) {
    const collection = await this.collection();

    return await collection.deleteOne({
      _id: new ObjectId(id),
    });
  }
}

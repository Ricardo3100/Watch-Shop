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
    const client = await clientPromise;

    // Replace "ecommerce" with your actual DB name if different
    const db = client.db("ecommerce");

    // "products" is the collection name in MongoDB
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

  /**
   * Update product stock.
   *
   * $inc allows us to increment/decrement a numeric field.
   *
   * This is useful for e-commerce when:
   * - An order is placed
   * - Inventory is reduced
   */
  static async updateStock(id: string, quantity: number) {
    const collection = await this.collection();

    return await collection.updateOne(
      { _id: new ObjectId(id) },
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

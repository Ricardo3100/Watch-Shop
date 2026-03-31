import { ObjectId } from "mongodb";

/**
 * DB shape (Mongo)
 */
export interface DBProduct {
  _id: ObjectId;
  name: string;
  image: string;
  price: number;
  stock: number;
  description: string;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Frontend / API shape
 */
export interface Product {
  _id: string;
  name: string;
  image: string;
  price: number;
  stock: number;
  description: string;
  category: string;
  createdAt?: string; // ← add ?
  updatedAt?: string; // ← add ?
  quantity?: number; // ← add this
}

/**
 * Create input (no id, no timestamps)
 */
export type CreateProductInput = Omit<
  Product,
  "_id" | "createdAt" | "updatedAt"
>;
//  cart item shape
export interface CartItem extends Product {
  quantity: number; // required here
}

"use server";
import clientPromise from "../api/Mongo-DB/mongodb";

export async function searchProducts(query: string) {
  if (!query) return [];

  const client = await clientPromise;

  const dbName = process.env.Mongo_DB_Name; // read from env
  if (!dbName)
    throw new Error("Please define the Mongo_DB_NAME environment variable");

  const db = client.db(dbName);

  const items = await db
    .collection("products")
    .find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      ],
    })
    .toArray();

  // Convert MongoDB types to plain JS
  const plainItems = items.map((item) => ({
    ...item,
    _id: item._id.toString(), // ObjectId → string
    createdAt: item.createdAt ? item.createdAt.toISOString() : null, // Date → string
    updatedAt: item.updatedAt ? item.updatedAt.toISOString() : null, // Date → string
  }));

  return plainItems;
}

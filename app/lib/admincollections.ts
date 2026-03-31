import clientPromise from "../api/Mongo-DB/mongodb";
import { Admin } from "@/types/admin";
export async function getAdminCollection() {
  const dbName = process.env.Mongo_DB_Name;

  if (!dbName) {
    throw new Error("Mongo_DB_Name not defined");
  }

  const client = await clientPromise;
  const db = client.db(dbName);
  // IMPORTANT: Without <Admin>, this defaults to Document and breaks type safety for nested fields
  //  (e.g. credentials with $pull)
  return db.collection<Admin>("admin");
}

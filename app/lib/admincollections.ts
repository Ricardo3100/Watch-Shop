import clientPromise from "../api/Mongo-DB/mongodb";

export async function getAdminCollection() {
  const dbName = process.env.Mongo_DB_Name;

  if (!dbName) {
    throw new Error("Mongo_DB_Name not defined");
  }

  const client = await clientPromise;
  const db = client.db(dbName);

  return db.collection("admin");
}

import { MongoClient } from "mongodb";

const uri = process.env.Mongo_URI as string;

if (!uri) {
  throw new Error("Please define the MONGO_URI environment variable");
}
// We use a global variable to store the MongoClient promise. 
// This ensures that we only create one instance of MongoClient
// across the entire application, even if this module is imported multiple times.
// This is important for performance and to avoid exhausting database connections.
let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  var _mongoClientPromise: Promise<MongoClient>;
}

if (!global._mongoClientPromise) {
  client = new MongoClient(uri);
  global._mongoClientPromise = client.connect();
}

clientPromise = global._mongoClientPromise;

export default clientPromise;

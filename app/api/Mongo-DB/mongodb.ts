import { MongoClient } from "mongodb";

const uri = process.env.Mongo_URI as string;

if (!uri) {
  throw new Error("Please define the MONGO_URI environment variable");
}

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

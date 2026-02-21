import { MongoClient } from "mongodb";

let client = null;
let db = null;

const MONGODB_URI = process.env.MONGODB_URI || "";
const DB_NAME = "retail-connect";

export async function getDb() {
  if (db) return db;
  if (!MONGODB_URI) throw new Error("MONGODB_URI is not set");
  client = new MongoClient(MONGODB_URI);
  await client.connect();
  db = client.db(DB_NAME);
  return db;
}

export function getCollection(name) {
  if (!db) throw new Error("DB not connected. Call getDb() first.");
  return db.collection(name);
}

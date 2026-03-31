import { Binary } from "mongodb";
import { ObjectId } from "mongodb";

// admin.ts → defines what an Admin looks
//  like (types/schema)
export type AdminCredential = {
  credentialID: string;
  _id?: ObjectId;
  
  // add more later if needed
  publicKey: Binary;
  transports: string[];
  counter: number;
  aaguid: string;
  deviceName: string;
  deviceEmoji: string;
  createdAt: Date;
};
// This file defines TypeScript types 
// related to admin users and their 
// credentials for passkey authentication.
export type Admin = {
   _id: any;
  credentials: AdminCredential[];
  currentChallenge?: string;
  name?: string;
};



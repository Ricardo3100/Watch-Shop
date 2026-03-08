/**
 * lib/encryption.ts
 *
 * This file does one job:
 * Encrypt and decrypt PII fields before they
 * are saved to or read from MongoDB.
 *
 * Think of it like a locked box.
 * - encrypt() puts the data in the box and locks it
 * - decrypt() unlocks the box and takes the data out
 *
 * We use AES-256-GCM — the same encryption standard
 * used by banks and governments.
 *
 * AES-256 means:
 * - 256 bit key — extremely hard to brute force
 * - Even if someone steals the database, the PII
 *   is unreadable without the ENCRYPTION_KEY
 *
 * GCM means:
 * - The encrypted data includes an authentication tag
 * - If anyone tampers with the encrypted data,
 *   decryption fails — you know it was tampered with
 *
 * Every encrypted value stores three things:
 * - iv (initialisation vector) — random bytes that
 *   make every encryption unique even for the same value
 * - authTag — proves the data was not tampered with
 * - encrypted — the actual encrypted data
 *
 * These are joined as a single string:
 * iv:authTag:encrypted
 * That string is what gets saved to MongoDB.
 */

import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";

// The key must be exactly 32 bytes for AES-256
// We store it as a 64 character hex string in .env
// and convert it to a Buffer here
function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
//  If the key is missing or invalid, we throw an error immediately
  if (!key) {
    throw new Error("ENCRYPTION_KEY environment variable is not set");
  }

  if (key.length !== 64) {
    throw new Error(
      "ENCRYPTION_KEY must be 64 hex characters (32 bytes). " +
        "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
    );
  }

  return Buffer.from(key, "hex");
}

// ----------------------------
// 🔒 ENCRYPT
// ----------------------------
// Takes a plain string and returns an encrypted string.
// Called before saving PII to MongoDB.
//
// Example:
// encrypt("customer@email.com")
// → "a1b2c3...:d4e5f6...:g7h8i9..."
export function encrypt(value: string): string {
  const key = getKey();

  // IV (initialisation vector) — random bytes
  // A new IV is generated for every encryption
  // This means encrypting the same value twice
  // produces different output each time — more secure
  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  // Encrypt the value
  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);

  // Auth tag proves the data was not tampered with
  const authTag = cipher.getAuthTag();

  // Join iv + authTag + encrypted as a single string
  // separated by colons so we can split it back out
  // when decrypting
  return [
    iv.toString("hex"),
    authTag.toString("hex"),
    encrypted.toString("hex"),
  ].join(":");
}

// ----------------------------
// 🔓 DECRYPT
// ----------------------------
// Takes an encrypted string and returns the original value.
// Called when reading PII from MongoDB to display it.
//
// Example:
// decrypt("a1b2c3...:d4e5f6...:g7h8i9...")
// → "customer@email.com"
export function decrypt(value: string): string {
  const key = getKey();

  // Split the stored string back into its three parts
  const [ivHex, authTagHex, encryptedHex] = value.split(":");

  if (!ivHex || !authTagHex || !encryptedHex) {
    throw new Error("Invalid encrypted value format");
  }

  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  // Decrypt and return the original string
  return decipher.update(encrypted) + decipher.final("utf8");
}

// ----------------------------
// 🛡️ SAFE DECRYPT
// ----------------------------
// Same as decrypt but returns null instead of throwing
// if the value is missing or invalid.
// Use this when reading from MongoDB where a field
// might not exist on older documents.
export function safeDecrypt(value: string | undefined | null): string | null {
  if (!value) return null;

  try {
    return decrypt(value);
  } catch {
    return null;
  }
}

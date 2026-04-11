import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

function getKey(): Buffer {
  const secret = process.env.JWT_SECRET ?? "fallback-secret-change-in-production";
  // Pad or trim to exactly 32 bytes for AES-256
  return Buffer.from(secret.slice(0, 32).padEnd(32, "0"), "utf8");
}

export function encryptPassword(plain: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-cbc", getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

export function decryptPassword(encrypted: string): string {
  try {
    const [ivHex, encHex] = encrypted.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const enc = Buffer.from(encHex, "hex");
    const decipher = createDecipheriv("aes-256-cbc", getKey(), iv);
    return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
  } catch {
    return "";
  }
}

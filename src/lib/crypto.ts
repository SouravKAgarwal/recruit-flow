import crypto from "crypto";

function getPublicKey() {
  const key = process.env.ENCRYPTION_PUBLIC_KEY;
  if (!key) throw new Error("ENCRYPTION_PUBLIC_KEY is missing");
  return key;
}

function getPrivateKey() {
  const key = process.env.ENCRYPTION_PRIVATE_KEY;
  if (!key) throw new Error("ENCRYPTION_PRIVATE_KEY is missing");
  return key;
}

/**
 * Hybrid encryption: Encrypts data using AES-256-GCM, and encrypts the AES key using RSA public key.
 * Format: Base64( RSA(aesKey) + ":" + AES(iv + ":" + ciphertext + ":" + authTag) )
 */
export function encryptData(text: string): string {
  if (!text) return text;
  const publicKey = getPublicKey();

  // 1. Generate a random AES key
  const aesKey = crypto.randomBytes(32); // 256 bit
  const iv = crypto.randomBytes(12);

  // 2. Encrypt the data with AES-GCM
  const cipher = crypto.createCipheriv("aes-256-gcm", aesKey, iv);
  const ciphertext = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // 3. Encrypt the AES key with RSA public key
  const encryptedAesKey = crypto.publicEncrypt(
    {
      key: publicKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    aesKey
  );

  // 4. Combine everything
  const payload = JSON.stringify({
    ek: encryptedAesKey.toString("base64"),
    iv: iv.toString("base64"),
    ct: ciphertext.toString("base64"),
    at: authTag.toString("base64"),
  });

  return Buffer.from(payload).toString("base64");
}

export function decryptData(encryptedPayload: string): string {
  if (!encryptedPayload) return encryptedPayload;
  
  // If the payload doesn't look like our JSON base64 format (e.g. legacy plain base64), return as is or handle it
  if (!encryptedPayload.startsWith("ey")) { // 'ey' is '{"' in base64
    try {
      // Legacy fallback for old encryptedPassword
      return Buffer.from(encryptedPayload, "base64").toString("utf-8");
    } catch {
      return encryptedPayload;
    }
  }

  const privateKey = getPrivateKey();

  try {
    const payloadStr = Buffer.from(encryptedPayload, "base64").toString("utf8");
    const payload = JSON.parse(payloadStr);

    if (!payload.ek || !payload.iv || !payload.ct || !payload.at) {
      // Not our format
      return encryptedPayload;
    }

    const encryptedAesKey = Buffer.from(payload.ek, "base64");
    const iv = Buffer.from(payload.iv, "base64");
    const ciphertext = Buffer.from(payload.ct, "base64");
    const authTag = Buffer.from(payload.at, "base64");

    // 1. Decrypt the AES key with RSA private key
    const aesKey = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: "sha256",
      },
      encryptedAesKey
    );

    // 2. Decrypt the ciphertext with AES-GCM
    const decipher = crypto.createDecipheriv("aes-256-gcm", aesKey, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

    return decrypted.toString("utf8");
  } catch (err) {
    console.error("Decryption failed:", err);
    // Legacy fallback
    return Buffer.from(encryptedPayload, "base64").toString("utf-8");
  }
}

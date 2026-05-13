import crypto from "crypto";

const IV_LENGTH = 16; // AES uses a 16-byte initialization vector

export const encryptMessage = (text) => {
  const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
  // If no text or no key (e.g. during dev without env vars), return original text
  if (!text || !ENCRYPTION_KEY) return text;

  try {
    const key = Buffer.from(ENCRYPTION_KEY, "hex");
    if (key.length !== 32) {
      console.warn("ENCRYPTION_KEY must be exactly 32 bytes (64 hex characters). Skipping encryption.");
      return text;
    }

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
    
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    return iv.toString("hex") + ":" + encrypted.toString("hex");
  } catch (error) {
    console.error("Encryption error:", error);
    return text;
  }
};

export const decryptMessage = (text) => {
  const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
  // If no text or no key, return original text
  if (!text || !ENCRYPTION_KEY) return text;

  try {
    const textParts = text.split(":");
    // If it doesn't have the "iv:encrypted" format, it's likely an unencrypted legacy message
    if (textParts.length !== 2) return text;

    const key = Buffer.from(ENCRYPTION_KEY, "hex");
    if (key.length !== 32) return text;

    const iv = Buffer.from(textParts.shift(), "hex");
    const encryptedText = Buffer.from(textParts.join(":"), "hex");
    
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString();
  } catch (error) {
    // If decryption fails (e.g. key changed, corrupted data), safely fallback to returning the original string or a placeholder
    return "This message could not be decrypted.";
  }
};

import crypto from "crypto";
import { ENCRYPTION_SECRET_KEY as SECRET_KEY } from "../../../../config/config.service.js";

const IV_LENGTH = 16;

const ENCRYPTION_SECRET_KEY = Buffer.from(SECRET_KEY, "hex");

export const encryption = async (text) => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    ENCRYPTION_SECRET_KEY,
    iv,
  );

  let encryptionData = cipher.update(text, "utf-8", "hex");
  encryptionData += cipher.final("hex");

  return `${iv.toString("hex")}:${encryptionData}`;
};

export const decryption = async (encryptionData) => {
  const [iv, encryptedText] = encryptionData.split(":");
  const binaryLikeIv = Buffer.from(iv, "hex");
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    ENCRYPTION_SECRET_KEY,
    binaryLikeIv,
  );

  let decryptData = decipher.update(encryptedText, "hex", "utf8");
  decryptData += decipher.final("utf-8");
  return decryptData;
};

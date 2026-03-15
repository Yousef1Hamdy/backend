import { compare, genSalt, hash } from "bcrypt";
import { SALT_ROUND } from "../../../../config/config.service.js";

export const generateHash = async ({
  plaintext,
  salt = SALT_ROUND,
  minor = "b",
} = {}) => {
  const generateSaLT = await genSalt(salt, minor);
  return await hash(plaintext, generateSaLT);
};

export const compareHash = async ({ plaintext, cipherText } = {}) => {
  const match = await compare(plaintext, cipherText);
  return match;
};

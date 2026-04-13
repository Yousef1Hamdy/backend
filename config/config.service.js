import { config } from "dotenv";
import { resolve } from "node:path";

export const NODE_ENV = process.env.NODE_ENV;

const envPath = {
  development: ".env.development",
  production: ".env.production",
};

console.log({ en: envPath[NODE_ENV] });

config({ path: resolve(`./config/${envPath[NODE_ENV]}`) });

export const PORT = process.env.PORT ?? 7000;
export const APPLICATION_NAME = process.env.APPLICATION_NAME;

export const DB_URL = process.env.DB_URL;
// redis
export const REDIS_URI = process.env.REDIS_URI;

// token
export const SYSTEM_TOKEN_SECRET_KEY = process.env.SYSTEM_TOKEN_SECRET_KEY;
export const USER_TOKEN_SECRET_KEY = process.env.USER_TOKEN_SECRET_KEY;
export const Hospital_TOKEN_SECRET_KEY = process.env.Hospital_TOKEN_SECRET_KEY;

export const SYSTEM_REFRESH_TOKEN_SECRET_KEY =
  process.env.SYSTEM_REFRESH_TOKEN_SECRET_KEY;

export const USER_REFRESH_TOKEN_SECRET_KEY =
  process.env.USER_REFRESH_TOKEN_SECRET_KEY;

export const Hospital_REFRESH_TOKEN_SECRET_KEY =
  process.env.Hospital_REFRESH_TOKEN_SECRET_KEY;

export const ACCESS_EXPIRE_IN = parseInt(process.env.ACCESS_EXPIRE_IN ?? 1800);
export const REFRESH_EXPIRE_IN = parseInt(
  process.env.REFRESH_EXPIRE_IN ?? 1800,
);

// hash && encryption
export const ENCRYPTION_SECRET_KEY = process.env.ENCRYPTION_SECRET_KEY;
export const SALT_ROUND = parseInt(process.env.SALT_ROUND ?? "10");

// SEND EMAIL

export const SMTP_USER = process.env.SMTP_USER;
export const SMTP_PASS = process.env.SMTP_PASS;
export const SMTP_HOST = process.env.SMTP_HOST;
export const SMTP_PORT = process.env.SMTP_PORT;

// cloud

export const CLOUD_NAME = process.env.CLOUD_NAME;
export const API_KEY = process.env.API_KEY;
export const API_SECRET = process.env.API_SECRET;

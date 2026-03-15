import { createClient } from "redis";
import { REDIS_URI } from "../../config/config.service.js";

export const redisClient = createClient({
  url: REDIS_URI,
});

export const connectRedis = async () => {
  try {
    await redisClient.connect();
    console.log(`REDIS_DB connected 👌🌸`);
  } catch (error) {
    console.log(`Fail to connect on redis DB ${error}`);
  }
};

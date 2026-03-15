import mongoose from "mongoose";
import { DB_URL } from "../../config/config.service.js";

export const authentication = async () => {
  try {
    await mongoose.connect(DB_URL, { serverSelectionTimeoutMS: 30000 });
    await mongoose.syncIndexes();
    console.log("DB connected successfully");
  } catch (error) {
    console.log(`fail to connected on database`);
  }
};

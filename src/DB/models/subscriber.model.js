import mongoose from "mongoose";

const subscriberSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
    },
  },
  {
    timestamps: true,
    collection: "Subscribers",
  }
);

export const SubscriberModel =
  mongoose.models.Subscriber ||
  mongoose.model("Subscriber", subscriberSchema);
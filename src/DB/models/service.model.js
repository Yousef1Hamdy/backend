import mongoose, { Schema } from "mongoose";

const serviceSchema = new Schema(
  {
    title: {
      type: String,
      required: true
    },
    slug: {
      type: String,
      required: true,
      unique: true
    },
    image: String,
    description: String
  },
  {
    timestamps: true,
    collection: "Services"
  }
);

export const ServiceModel =
  mongoose.models.Service ||
  mongoose.model("Service", serviceSchema);
import mongoose, { Schema } from "mongoose";

const partnerSchema = new Schema(
  {
    name: {
      type: String,
      required: true
    },
    logo: {
      type: String, // URL
      required: true
    },
    type: {
      type: String, // hospital,
    }
  },
  {
    timestamps: true,
    collection: "Partners"
  }
);

export const PartnerModel =
  mongoose.models.Partner ||
  mongoose.model("Partner", partnerSchema);
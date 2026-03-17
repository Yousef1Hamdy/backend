import mongoose, { Schema } from "mongoose";

const childcareSchema = new Schema(
  {
    name: String,
    description: String,
    price: Number,
    location: String,
  },
  {
    timestamps: true,
    collection: "Childcare"
  }
);

export const ChildcareModel =
  mongoose.models.Childcare ||
  mongoose.model("Childcare", childcareSchema);
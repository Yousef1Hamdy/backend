import mongoose from "mongoose";

const childcareSchema = new mongoose.Schema(
  {
    name: String,
    address: String,
    phone: String,

    nicuAvailable: {
      type: Number,
      default: 0
    },

    normalAvailable: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

export const ChildcareModel = mongoose.model("Childcare", childcareSchema);
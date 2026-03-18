import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    childcareId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Childcare"
    },

    hospitalName: String,

    childName: String,
    phone: String,
    condition: String,

    type: {
      type: String,
      enum: ["nicu", "normal"]
    }
  },
  { timestamps: true }
);

export const OrderModel = mongoose.model("Order", orderSchema);
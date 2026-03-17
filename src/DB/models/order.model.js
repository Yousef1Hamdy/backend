import mongoose, { Schema } from "mongoose";

const orderSchema = new Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true
    },
    childcareId: {
      type: mongoose.Types.ObjectId,
      ref: "Childcare"
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending"
    }
  },
  {
    timestamps: true,
    collection: "Orders"
  }
);

export const OrderModel =
  mongoose.models.Order ||
  mongoose.model("Order", orderSchema);
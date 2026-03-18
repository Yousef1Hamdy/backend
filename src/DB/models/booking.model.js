import mongoose from "mongoose";
import { BookingEnum } from "../../common/index.js";

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "المستخدم مطلوب"],
    },

    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: [true, "المستشفى مطلوب"],
    },

    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: [true, "الخدمة المطلوبة"],
    },

    date: {
      type: Date,
      required: [true, "تاريخ الحجز مطلوب"],
    },

    status: {
      type: String,
      enum: Object.values(BookingEnum),
      default: "pending",
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "Bookings",
  },
);

export const BookingModel =
  mongoose.models.Booking || mongoose.model("Booking", bookingSchema);

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

    reservationType: {
      type: String,
      trim: true,
    },

    patientName: {
      type: String,
      trim: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    address: {
      type: String,
      trim: true,
    },

    condition: {
      type: String,
      trim: true,
    },

    serviceType: {
      type: String,
      trim: true,
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

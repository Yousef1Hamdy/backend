import mongoose from "mongoose";
import {
  BadRequestException,
  BookingEnum,
  TypeServiceEnum,
} from "../../common/index.js";
import { ServiceModel } from "./service.model.js";

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

bookingSchema.pre("save", function saveState() {
  this.$locals.wasNew = this.isNew;
});

bookingSchema.pre("save", async function decrementServiceCapacity() {
  if (!this.isNew) {
    return;
  }

  const service = await ServiceModel.findOneAndUpdate(
    {
      _id: this.serviceId,
      hospital: this.hospitalId,
      capacity: { $gt: 0 },
    },
    { $inc: { capacity: -1 } },
    { new: true, runValidators: true },
  ).lean();

  if (!service) {
    throw BadRequestException({
      message: "service is full or not found",
    });
  }

  this.serviceType = this.serviceType || service.type;

  if (!this.reservationType) {
    this.reservationType =
      service.type === TypeServiceEnum.Nursery ? "childcare" : "healthcare";
  }
});

bookingSchema.post("save", async function notifyHospitalOnBooking(doc) {
  if (!doc.$locals?.wasNew) {
    return;
  }

  const service = await ServiceModel.findById(doc.serviceId)
    .select("name type hospital")
    .lean();

  if (!service || !doc.hospitalId) {
    return;
  }

  const reservationType =
    doc.reservationType ||
    (service.type === TypeServiceEnum.Nursery ? "childcare" : "healthcare");
  const patientName = doc.patientName || "Patient";
  const { createHospitalNotification } = await import(
    "../../modules/hospitalAccountNotifications/notifications.service.js"
  );

  await createHospitalNotification({
    hospitalId: doc.hospitalId,
    type: "new-reservation",
    title: `\u0637\u0644\u0628 \u062d\u062c\u0632 \u062c\u062f\u064a\u062f \u0641\u064a ${service.name}`,
    message: `\u062a\u0645 \u0625\u0631\u0633\u0627\u0644 \u0637\u0644\u0628 \u062d\u062c\u0632 \u062c\u062f\u064a\u062f \u0644\u0642\u0633\u0645 ${service.name}`,
    route: `/hospital-account/reservations/${reservationType}`,
    metadata: {
      bookingId: doc._id,
      serviceId: service._id,
      reservationType,
      patientName,
    },
  });
});

export const BookingModel =
  mongoose.models.Booking || mongoose.model("Booking", bookingSchema);

import mongoose from "mongoose";
import { BookingEnum, statusEnum } from "../../common/index.js";

const bookingSchema = new mongoose.Schema(
  {
    /* ==============================
       Patient (Requester)
    ============================== */
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "المستخدم مطلوب"],
      index: true,
    },

    /* ==============================
       Service Type
    ============================== */
    serviceType: {
      type: String,
      enum: Object.values(BookingEnum),
      required: [true, "يرجى تحديد نوع الخدمة"],
    },

    /* ==============================
       Patient Info
    ============================== */
    patientName: {
      type: String,
      required: [true, "اسم المريض مطلوب"],
      trim: true,
    },

    phone: {
      type: String,
      required: [true, "رقم الهاتف مطلوب"],
      match: [/^01[0-2,5]{1}[0-9]{8}$/, "رقم الهاتف غير صحيح"],
    },

    address: {
      type: String,
      required: [true, "العنوان مطلوب"],
      trim: true,
    },

    medicalCondition: {
      type: String,
      required: [true, "وصف الحالة الطبية مطلوب"],
      trim: true,
    },

    /* ==============================
       Booking Status
    ============================== */
    status: {
      type: String,
      enum: Object.values(statusEnum),
      default: statusEnum.pending,
      index: true,
    },

    /* ==============================
       Booking Timeline
    ============================== */
    acceptedAt: Date,
    completedAt: Date,
    cancelledAt: Date,
  },
  {
    timestamps: true,
    strict: true,
    strictQuery: true,
    optimisticConcurrency: true,
    autoIndex: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

/* =====================================
   Virtual → Booking Owner Info
===================================== */
bookingSchema.virtual("patient", {
  ref: "User",
  localField: "userId",
  foreignField: "_id",
  justOne: true,
});

bookingSchema.pre("findOneAndUpdate", async function capturePreviousStatus() {
  const current = await this.model.findOne(this.getFilter()).select("status userId serviceType");
  this._previousBookingState = current
    ? {
        status: current.status,
        userId: current.userId,
        serviceType: current.serviceType,
      }
    : null;
});

bookingSchema.post("findOneAndUpdate", async function notifyUserOnDecision(doc) {
  if (!doc) {
    return;
  }

  const previous = this._previousBookingState;

  if (!previous || previous.status === doc.status) {
    return;
  }

  if (![statusEnum.confirmed, "refused"].includes(doc.status)) {
    return;
  }

  const { createUserNotification } = await import(
    "../../modules/user/user.notifications.service.js"
  );

  const decisionLabel = doc.status === statusEnum.confirmed ? "قبول" : "رفض";

  await createUserNotification({
    userId: doc.userId,
    type: "nurse-booking-status-updated",
    title: `${decisionLabel} طلب الطاقم الطبي`,
    message: `تم ${decisionLabel} طلب ${doc.serviceType || "الطاقم الطبي"}`,
    route: "/booking-staff/my",
    metadata: {
      bookingId: doc._id,
      serviceType: doc.serviceType || null,
      status: doc.status,
    },
  });
});


export const BookingNurseModel =
  mongoose.models.BookingNurse || mongoose.model("BookingNurse", bookingSchema);

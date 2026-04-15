import mongoose from "mongoose";

const hospitalAccountReservationStateSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      unique: true,
    },
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "refused"],
      default: "pending",
    },
    decisionAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "HospitalAccountReservationStates",
  },
);

export const HospitalAccountReservationStateModel =
  mongoose.models.HospitalAccountReservationState ||
  mongoose.model(
    "HospitalAccountReservationState",
    hospitalAccountReservationStateSchema,
  );

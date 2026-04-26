import mongoose from "mongoose";

const serviceCapacityHistorySchema = new mongoose.Schema(
  {
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
      index: true,
    },
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: true,
      index: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: 0,
    },
    effectiveAt: {
      type: Date,
      required: true,
      index: true,
    },
    source: {
      type: String,
      trim: true,
      default: "system",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: undefined,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "ServiceCapacityHistories",
  },
);

serviceCapacityHistorySchema.index({ serviceId: 1, effectiveAt: -1 });

export const ServiceCapacityHistoryModel =
  mongoose.models.ServiceCapacityHistory ||
  mongoose.model("ServiceCapacityHistory", serviceCapacityHistorySchema);

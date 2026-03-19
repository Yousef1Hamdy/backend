import mongoose from "mongoose";
import { TypeServiceEnum } from "../../common/index.js";

const serviceSchema = new mongoose.Schema(
  {
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: [true, "المستشفى مطلوب"],
    },

    name: {
      type: String,
      required: [true, "اسم الخدمة مطلوب"],
      trim: true,
      minlength: [2, "اسم الخدمة لازم يكون على الأقل حرفين"],
      maxlength: [100, "اسم الخدمة لا يزيد عن 100 حرف"],
    },

    type: {
      type: String,
      enum: Object.values(TypeServiceEnum),
      required: [true, "نوع الخدمة مطلوب"],
    },

    description: {
      type: [String],
    },

    capacity: {
      type: Number,
      min: [0, "السعة لا يمكن أن تكون أقل من 0"],
    },

  },
  {
    timestamps: true,
    versionKey: false,
    collection: "Services",
  },
);

export const ServiceModel =
  mongoose.models.Service || mongoose.model("Service", serviceSchema);

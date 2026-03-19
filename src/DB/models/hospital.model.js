import mongoose from "mongoose";

const hospitalSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "اسم المستشفى مطلوب"],
      trim: true,
      minlength: [3, "اسم المستشفى لازم يكون على الأقل 3 حروف"],
      maxlength: [100, "اسم المستشفى لا يزيد عن 100 حرف"],
      unique: true,
    },
    location: {
      city: {
        type: String,
        required: [true, "المدينة مطلوبة"],
        trim: true,
      },
      address: {
        type: String,
        required: [true, "العنوان مطلوب"],
        trim: true,
        minlength: [5, "العنوان لازم يكون على الأقل 5 حروف"],
      },
    },
  },
  {
    timestamps: true,
    collection: "Hospitals",
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

hospitalSchema.virtual("services", {
  ref: "Service",
  localField: "_id",
  foreignField: "hospital",
});



export const HospitalModel =
  mongoose.models.Hospital || mongoose.model("Hospital", hospitalSchema);

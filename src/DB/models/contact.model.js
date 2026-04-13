import mongoose, { Schema } from "mongoose";

const contactSchema = new Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "User"
    },
    email: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true,
    collection: "Contacts"
  }
);

export const ContactModel =
  mongoose.models.Contact ||
  mongoose.model("Contact", contactSchema);
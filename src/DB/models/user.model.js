import mongoose, { Schema } from "mongoose";
import { RoleEnum, GenderEnum, ProviderEnum } from "../../common/index.js";

const userSchema = new Schema(
  {
    firstName: {
      type: String,
      minLength: [2, "length must be greater than 2"],
      maxLength: 12,
      required: [true, "first name is required"],
      trim: true,
    },
    lastName: {
      type: String,
      maxLength: 12,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      trim: true,
      select: false,
      minlength: 6,
    },
    phone: String,
    role: {
      type: Number,
      enum: Object.values(RoleEnum),
      default: RoleEnum.User,
    },
    gender: {
      type: Number,
      enum: Object.values(GenderEnum),
      default: GenderEnum.Male,
    },
    provider: {
      type: Number,
      enum: Object.values(ProviderEnum),
      default: ProviderEnum.System,
    },
    profilePicture: String,
    coverProfilePictures: [String],
    confirmEmail: Date,
    changeCredentialTime: Date,
  },
  {
    timestamps: true,
    collection: "Users",
    strict: true,
    strictQuery: true,
    optimisticConcurrency: true,
    autoIndex: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);
userSchema
  .virtual("username")
  .set(function (value) {
    const [firstName, lastName] = value.split(" ") || [];
    this.set({ firstName, lastName });
  })
  .get(function () {
    return `${this.firstName} ${this.lastName || ""}`.trim();
  });

export const UserModel =
  mongoose.models.User || mongoose.model("User", userSchema);

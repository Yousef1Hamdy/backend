import mongoose, { Schema } from "mongoose";
import { RoleEnum, GenderEnum, ProviderEnum } from "../../common/index.js";

const userSchema = new Schema(
  {
    firstName: {
      type: String,
      minlength: [2, "الاسم الأول لازم يكون على الأقل حرفين"],
      maxlength: [12, "الاسم الأول لا يزيد عن 12 حرف"],
      required: [true, "الاسم الأول مطلوب"],
      trim: true,
    },

    lastName: {
      type: String,
      maxlength: [12, "اسم العائلة لا يزيد عن 12 حرف"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "البريد الإلكتروني مطلوب"],
      trim: true,
      unique: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: [true, "كلمة المرور مطلوبة"],
      trim: true,
      select: false,
      minlength: [6, "كلمة المرور لازم تكون على الأقل 6 حروف"],
    },

    phone: {
      type: String,
    },

    role: {
      type: Number,
      enum: Object.values(RoleEnum),
      default: RoleEnum.User,
    },

    gender: {
      type: Number,
      enum: {
        values: Object.values(GenderEnum),
        message: "النوع غير صالح",
      },
      default: GenderEnum.Male,
    },

    provider: {
      type: Number,
      enum: Object.values(ProviderEnum),
      default: ProviderEnum.System,
    },

    address: {
      type: String,
      minlength: [5, "العنوان لازم يكون على الأقل 5 حروف"],
      maxlength: [200, "العنوان لا يزيد عن 200 حرف"],
    },
    nurseDocument: {
      secure_url: String,
      public_id: String,
    },
    oldPassword: [String],

    profilePicture: { secure_url: String, public_id: String },

    coverProfilePictures: [{ secure_url: String, public_id: String }],

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

// 👤 virtual username
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

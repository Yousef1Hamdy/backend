import joi from "joi";
import { generalValidationFields } from "../../common/index.js";

export const updateProfile = {
  body: joi.object({
    firstName: joi.string().min(2),
    lastName: joi.string().min(2),
    phone: joi.string(),
    profilePicture: joi.string()
  }).min(1)
};

export const updatePassword = {
  body: joi
    .object({
      password: generalValidationFields.password.required(),
      confirmPassword: generalValidationFields.confirmPassword("password").required(),
    })
    .required(),
};

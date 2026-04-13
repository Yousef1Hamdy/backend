import joi from "joi";
import {
  generalValidationFields,
  fileFieldValidation,
} from "../../common/index.js";

export const login = {
  body: joi
    .object({
      email: generalValidationFields.email.required(),
      password: generalValidationFields.password.required(),
    })
    .required(),
};

export const signup = {
  body: login.body.append({
    phone: generalValidationFields.phone.required(),
    username: generalValidationFields.username.required(),
    address: generalValidationFields.address.required(),
    role: generalValidationFields.role.required(),
    gender: generalValidationFields.gender.required(),
    confirmPassword: generalValidationFields
      .confirmPassword("password")
      .required(),
  }),
};

export const resendConfirmEmail = {
  body: joi
    .object()
    .keys({
      email: generalValidationFields.email.required(),
    })
    .required(),
};

export const confirmEmail = {
  body: resendConfirmEmail.body
    .append({
      otp: generalValidationFields.otp.required(),
    })
    .required(),
};

export const resetForgotPassword = {
  body: confirmEmail.body.append({
    password: generalValidationFields.password.required(),
    confirmPassword: generalValidationFields
      .confirmPassword("password")
      .required(),
  }),
};

export const profileImage = {
  file: generalValidationFields.file(fileFieldValidation.image).required(),
};
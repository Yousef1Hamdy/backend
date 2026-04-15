import joi from "joi";
import { generalValidationFields } from "../../common/index.js";

export const getHospitalAccountProfile = {
  params: joi.object().keys({}).required(),
};

export const getHospitalAccountPlaces = {
  params: joi.object().keys({}).required(),
};

export const updateHospitalAccountProfile = {
  params: joi.object().keys({}).required(),
  body: joi
    .object()
    .keys({
      hospitalName: generalValidationFields.nameHospital,
      address: generalValidationFields.address,
      city: joi.string(),
      email: generalValidationFields.email,
      phone: generalValidationFields.phone,
    })
    .min(1)
    .required(),
};

export const changeHospitalAccountPassword = {
  params: joi.object().keys({}).required(),
  body: joi
    .object()
    .keys({
      currentPassword: joi.string().required(),
      password: generalValidationFields.password.required(),
      confirmPassword: generalValidationFields.confirmPassword().required(),
    })
    .required(),
};

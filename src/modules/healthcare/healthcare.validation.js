import joi from "joi";
import { generalValidationFields } from "../../common/index.js";

export const healthcareId = {
  params: joi.object({
    id: generalValidationFields.id.required(),
  }),
};

export const bookHealthcare = {
  body: joi.object({
    patientName: generalValidationFields.patientName.required(),
    phone: generalValidationFields.phone.required(),
    condition: generalValidationFields.medicalCondition.required(),
    careType: joi.string().valid("icu", "ccu", "picu").required(),
  }),
  params: joi.object({
    id: generalValidationFields.id.required(),
  }),
};

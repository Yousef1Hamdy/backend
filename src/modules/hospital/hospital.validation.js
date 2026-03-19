import joi from "joi";
import { generalValidationFields } from "../../common/index.js";

export const recordHospital = {
  body: joi
    .object()
    .keys({
      name: generalValidationFields.nameHospital.required(),
      location: generalValidationFields.location.required(),
    })
    .required(),
};

export const hospitalId = {
  params: joi
    .object()
    .keys({
      id: generalValidationFields.id.required(),
    })
    .required(),
};

export const editHospital = {
  body: joi
    .object({
      name: generalValidationFields.nameHospital,
      location: generalValidationFields.location,
    })
    .min(1) // لازم يكون في حقل واحد على الأقل للتحديث
    .required()
    .messages({
      "object.min":
        "يجب إرسال حقل واحد على الأقل لتحديث المستشفى (مثال: name أو location)",
    }),

  params: hospitalId.params.required(),
};

import joi from "joi";
import { generalValidationFields } from "../../common/index.js";

export const CreateService = {
  body: joi
    .object()
    .keys({
      hospital: generalValidationFields.id.required(),
      name: generalValidationFields.nameService.required(),
      capacity: generalValidationFields.capacityService.required(),
      description: generalValidationFields.descriptionService.required(),
    })
    .required(),
};

export const serviceId = {
  params: joi
    .object()
    .keys({
      id: generalValidationFields.id.required(),
    })
    .required(),
};

export const updateService = {
  body: joi
    .object()
    .keys({
      name: generalValidationFields.nameService,
      capacity: generalValidationFields.capacityService,
      description: generalValidationFields.descriptionService,
    })
    .min(1)
    .messages({
      "object.min": "يجب إدخال حقل واحد على الأقل للتحديث",
      "object.base": "البيانات يجب أن تكون كائن",
      "any.required": "البيانات مطلوبة",
    })
    .required(),
  params: serviceId.params.required(),
};

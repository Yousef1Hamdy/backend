import joi from "joi";
import { generalValidationFields } from "../../common/index.js";

export const deleteEntityById = {
  params: joi
    .object()
    .keys({
      id: generalValidationFields.id.required(),
    })
    .required(),
};

export const addHospital = {
  body: joi
    .object()
    .keys({
      name: generalValidationFields.nameHospital.required(),
      location: generalValidationFields.location.required(),
    })
    .required(),
};

export const addService = {
  body: joi
    .object()
    .keys({
      hospital: generalValidationFields.id.required(),
      name: generalValidationFields.nameService.required(),
      type: generalValidationFields.typeService.required(),
      description: generalValidationFields.descriptionService.required(),
      capacity: generalValidationFields.capacityService.required(),
    })
    .required(),
};

import joi from "joi";
import { generalValidationFields } from "../../common/index.js";

const dateFilter = joi
  .string()
  .isoDate()
  .messages({
    "string.isoDate": "date must be a valid ISO date",
  });

export const getHospitalAccountHome = {
  query: joi
    .object()
    .keys({
      date: dateFilter,
    })
    .required(),
};

export const getHospitalHome = {
  params: joi
    .object()
    .keys({
      hospitalId: generalValidationFields.id.required(),
    })
    .required(),
  query: joi
    .object()
    .keys({
      date: dateFilter,
    })
    .required(),
};

export const updateHospitalPlaces = {
  params: joi
    .object()
    .keys({
      hospitalId: generalValidationFields.id.required(),
      serviceId: generalValidationFields.id.required(),
    })
    .required(),
  body: joi
    .object()
    .keys({
      capacity: generalValidationFields.capacityService.required(),
    })
    .required(),
};

export const updateHospitalPlacesByAccount = {
  params: joi
    .object()
    .keys({
      serviceId: generalValidationFields.id.required(),
    })
    .required(),
  body: joi
    .object()
    .keys({
      capacity: generalValidationFields.capacityService.required(),
    })
    .required(),
};

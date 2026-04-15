import joi from "joi";
import { generalValidationFields } from "../../common/index.js";

export const createBooking = {
  body: joi.object({
    serviceType: generalValidationFields.homeCareServiceType.required(),
    patientName: generalValidationFields.patientName.required(),
    phone: generalValidationFields.phone.required(),
    address: generalValidationFields.address.required(),
    medicalCondition: generalValidationFields.medicalCondition.required(),
  }),
};

export const updateBooking = {
  body: joi
    .object({
      serviceType: generalValidationFields.homeCareServiceType.optional(),
      patientName: generalValidationFields.patientName.optional(),
      phone: generalValidationFields.phone.optional(),
      address: generalValidationFields.address.optional(),
      medicalCondition: generalValidationFields.medicalCondition.optional(),
    })
    .min(1),
};

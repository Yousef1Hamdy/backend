import joi from "joi";
import { generalValidationFields } from "../../common/index.js";

export const getHospitalReservations = {
  params: joi
    .object()
    .keys({
      reservationType: joi.string().valid("childcare", "healthcare").required(),
    })
    .required(),
};

export const getHospitalReservationDetails = {
  params: joi
    .object()
    .keys({
      reservationType: joi.string().valid("childcare", "healthcare").required(),
      reservationId: generalValidationFields.id.required(),
    })
    .required(),
};

export const updateHospitalReservationStatus = {
  params: getHospitalReservationDetails.params.required(),
  body: joi
    .object()
    .keys({
      action: joi.string().valid("accept", "refuse").required(),
    })
    .required(),
};

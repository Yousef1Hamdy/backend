import joi from "joi";
import { generalValidationFields } from "../../common/index.js";

export const getHospitalBookings = {
  params: joi
    .object()
    .keys({
      reservationType: joi.string().valid("childcare", "healthcare").required(),
      bookingStatus: joi.string().valid("accepted", "refused").required(),
    })
    .required(),
};

export const removeAcceptedHospitalReservation = {
  params: joi
    .object()
    .keys({
      reservationType: joi.string().valid("childcare", "healthcare").required(),
      reservationId: generalValidationFields.id.required(),
    })
    .required(),
};

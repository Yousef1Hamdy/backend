import joi from "joi";

export const getBookings = {
  headers: joi
    .object({
      authorization: joi.string().required(),
    })
    .unknown(true)
    .required(),
};

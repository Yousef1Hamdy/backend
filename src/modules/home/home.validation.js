import joi from "joi";

export const getHome = {
  headers: joi
    .object({
      authorization: joi.string().required(),
    })
    .unknown(true)
    .required(),
};

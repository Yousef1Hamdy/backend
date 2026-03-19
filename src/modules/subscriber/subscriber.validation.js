import joi from "joi";

export const subscribe = {
  body: joi.object({
    email: joi.string().email().required()
  })
};
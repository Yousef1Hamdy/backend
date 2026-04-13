import joi from "joi";

export const sendMessage = {
  body: joi.object({
    email: joi.string().email().required(),
    message: joi.string().min(5).required()
  })
};
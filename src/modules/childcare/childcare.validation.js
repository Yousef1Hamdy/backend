import joi from "joi";
import { generalValidationFields } from "../../common/index.js";

export const bookChildcare = {
  body: joi.object({
    childName: joi.string().min(2).required(),
    phone: joi.string().required(),
    condition: joi.string().required(),
    type: joi.string().valid("nicu", "normal").required()
  }),

  params: joi.object({
    id: generalValidationFields.id.required()
  })
};
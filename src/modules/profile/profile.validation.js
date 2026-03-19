import joi from "joi";

export const updateProfile = {
  body: joi.object({
    firstName: joi.string().min(2),
    lastName: joi.string().min(2),
    phone: joi.string(),
    profilePicture: joi.string()
  }).min(1)
};
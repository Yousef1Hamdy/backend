import joi from "joi";
import { generalValidationFields, RoleEnum } from "../../common/index.js";

export const deleteEntityById = {
  params: joi
    .object()
    .keys({
      id: generalValidationFields.id.required(),
    })
    .required(),
};

export const addHospital = {
  body: joi
    .object()
    .keys({
      name: generalValidationFields.nameHospital.required(),
      location: generalValidationFields.location.required(),
      logo: joi.string().uri().required(),
      username: generalValidationFields.username.required(),
      email: generalValidationFields.email.required(),
      password: generalValidationFields.password.required(),
      phone: generalValidationFields.phone.required(),
      address: generalValidationFields.address.required(),
      gender: generalValidationFields.gender.optional(),
    })
    .required(),
};

export const addService = {
  body: joi
    .object()
    .keys({
      hospital: generalValidationFields.id.required(),
      name: generalValidationFields.nameService.required(),
      type: generalValidationFields.typeService.required(),
      description: generalValidationFields.descriptionService.required(),
      capacity: generalValidationFields.capacityService.required(),
    })
    .required(),
};

export const listUsers = {
  query: joi
    .object({
      role: joi.number().valid(RoleEnum.User, RoleEnum.Hospital, RoleEnum.Nurse),
    })
    .required(),
};

export const addManagedUser = {
  body: joi
    .object({
      username: generalValidationFields.username.required(),
      email: generalValidationFields.email.required(),
      password: generalValidationFields.password.required(),
      phone: generalValidationFields.phone.required(),
      address: generalValidationFields.address.required(),
      role: joi
        .number()
        .valid(RoleEnum.User, RoleEnum.Hospital, RoleEnum.Nurse)
        .required(),
      gender: generalValidationFields.gender.optional(),
      hospitalId: generalValidationFields.id,
    })
    .required(),
};

export const updateHospital = {
  params: deleteEntityById.params.required(),
  body: joi
    .object()
    .keys({
      name: generalValidationFields.nameHospital,
      location: generalValidationFields.location,
      logo: joi.string().uri(),
      username: generalValidationFields.username,
      email: generalValidationFields.email,
      password: generalValidationFields.password,
      phone: generalValidationFields.phone,
      address: generalValidationFields.address,
      gender: generalValidationFields.gender.optional(),
    })
    .min(1)
    .required(),
};

export const updateService = {
  params: deleteEntityById.params.required(),
  body: joi
    .object()
    .keys({
      hospital: generalValidationFields.id,
      name: generalValidationFields.nameService,
      type: generalValidationFields.typeService,
      description: generalValidationFields.descriptionService,
      capacity: generalValidationFields.capacityService,
    })
    .min(1)
    .required(),
};

export const updateManagedUser = {
  params: deleteEntityById.params.required(),
  body: joi
    .object({
      username: generalValidationFields.username,
      email: generalValidationFields.email,
      password: generalValidationFields.password,
      phone: generalValidationFields.phone,
      address: generalValidationFields.address,
      gender: generalValidationFields.gender.optional(),
      role: joi.number().valid(RoleEnum.User, RoleEnum.Hospital, RoleEnum.Nurse),
      hospitalId: generalValidationFields.id,
    })
    .min(1)
    .required(),
};

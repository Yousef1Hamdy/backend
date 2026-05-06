import joi from "joi";

import {
  fileFieldValidation,
  generalValidationFields,
} from "../../common/index.js";

export const profileImage = {
  file: generalValidationFields.file(fileFieldValidation.image).required(),
};

export const updatePassword = {
  body: joi
    .object()
    .keys({
      oldPassword: generalValidationFields.password.required(),
      password: generalValidationFields.password
        .not(joi.ref("oldPassword"))
        .required(),
      confirmPassword: generalValidationFields
        .confirmPassword("password")
        .required(),
    })
    .required(),
};

export const shareProfile = {
  params: joi
    .object()
    .keys({
      userId: generalValidationFields.id.required(),
    })
    .required(),
};

export const getUserNotifications = {
  params: joi.object().keys({}).required(),
};

export const markUserNotificationAsRead = {
  params: joi
    .object()
    .keys({
      notificationId: generalValidationFields.id.required(),
    })
    .required(),
};

export const markAllUserNotificationsAsRead = {
  params: joi.object().keys({}).required(),
};

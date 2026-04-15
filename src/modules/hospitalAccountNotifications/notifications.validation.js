import joi from "joi";
import { generalValidationFields } from "../../common/index.js";

export const getHospitalNotifications = {
  params: joi.object().keys({}).required(),
};

export const markHospitalNotificationAsRead = {
  params: joi
    .object()
    .keys({
      notificationId: generalValidationFields.id.required(),
    })
    .required(),
};

export const markAllHospitalNotificationsAsRead = {
  params: joi.object().keys({}).required(),
};

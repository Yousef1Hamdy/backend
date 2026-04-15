import {
  createHospitalNotification,
} from "../hospitalAccountNotifications/notifications.service.js";
import {
  ServiceModel,
  BookingModel,
  HospitalModel,
  UserModel
} from "../../DB/index.js";
import { TypeServiceEnum } from "../../common/index.js";

import {
  find,
  findById,
  createOne
} from "../../DB/index.js";
import { getModuleRecordById } from "../shared/module.shared.js";

//  GET ALL 
export const getAllChildcare = async () => {
  return await find({
    model: ServiceModel,
    filter: { type: TypeServiceEnum.Nursery },
    select: "name type capacity description hospital",
    options: {
      populate: [{ path: "hospital", select: "name location" }]
    }
  });
};

//   GET DETAILS
export const getChildcareDetails = async (id) => {
  return await findById({
    model: ServiceModel,
    id,
    select: "name type capacity description hospital",
    options: {
      populate: [{ path: "hospital", select: "name location" }]
    }
  });
};

//  BOOK
export const bookChildcare = async (userId, serviceId, details) => {

  const service = await getModuleRecordById({
    model: ServiceModel,
    id: serviceId,
    notFoundMessage: "Service not found",
  });

  const user = await getModuleRecordById({
    model: UserModel,
    id: userId,
    select: "address",
    notFoundMessage: "User not found",
  });

  //  create booking 
  await createOne({
    model: BookingModel,
    data: {
      userId,
      serviceId,
      hospitalId: service.hospital || service.hospitalId,
      date: new Date(), //  required
      status: "pending",
      reservationType: "childcare",
      patientName: details.childName,
      phone: details.phone,
      address: user?.address || null,
      condition: details.condition,
      serviceType: service.type,
    }
  });

  const notificationPayload = {
    hospitalId: service.hospital || service.hospitalId,
    type: "new-reservation",
    title: `\u0637\u0644\u0628 \u062d\u062c\u0632 \u062c\u062f\u064a\u062f \u0641\u064a ${service.name}`,
    message: `\u062a\u0645 \u0625\u0631\u0633\u0627\u0644 \u0637\u0644\u0628 \u062d\u062c\u0632 \u062c\u062f\u064a\u062f \u0644\u0642\u0633\u0645 ${service.name}`,
    route: "/hospital-account/reservations/childcare",
    metadata: {
      serviceId: service._id,
      reservationType: "childcare",
      patientName: details.childName,
    },
  };

  await createHospitalNotification(notificationPayload);

  // return confirmation
  const hospital = await getModuleRecordById({
    model: HospitalModel,
    id: service.hospital || service.hospitalId,
    select: "name",
  });

  return {
    hospitalName: hospital?.name,
    childName: details.childName,
    phone: details.phone,
    condition: details.condition,
    type: details.type,
    address: user?.address || null,
  };
};

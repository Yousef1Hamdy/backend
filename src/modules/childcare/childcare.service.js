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

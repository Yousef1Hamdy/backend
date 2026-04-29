import {
  BookingModel,
  HospitalModel,
  ServiceModel,
  UserModel,
  createOne,
  find,
  findById,
} from "../../DB/index.js";
import { TypeServiceEnum } from "../../common/index.js";
import { getModuleRecordById } from "../shared/module.shared.js";

export const getAllHealthcare = async () => {
  return await find({
    model: ServiceModel,
    filter: { type: TypeServiceEnum.Care },
    select: "name type capacity description hospital",
    options: {
      populate: [{ path: "hospital", select: "name location" }],
    },
  });
};

export const getHealthcareDetails = async (id) => {
  return await findById({
    model: ServiceModel,
    id,
    select: "name type capacity description hospital",
    options: {
      populate: [{ path: "hospital", select: "name location" }],
    },
  });
};

export const bookHealthcare = async (userId, serviceId, details) => {
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

  await createOne({
    model: BookingModel,
    data: {
      userId,
      serviceId,
      hospitalId: service.hospital || service.hospitalId,
      date: new Date(),
      status: "pending",
      reservationType: "healthcare",
      patientName: details.patientName,
      phone: details.phone,
      address: user?.address || null,
      condition: details.condition,
      serviceType: service.type,
    },
  });

  const hospital = await getModuleRecordById({
    model: HospitalModel,
    id: service.hospital || service.hospitalId,
    select: "name",
  });

  return {
    hospitalName: hospital?.name,
    patientName: details.patientName,
    phone: details.phone,
    condition: details.condition,
    address: user?.address || null,
    serviceName: service.name,
  };
};

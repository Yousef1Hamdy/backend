import {
  ServiceModel,
  BookingModel,
  HospitalModel
} from "../../DB/index.js";

import {
  find,
  findById,
  createOne
} from "../../DB/index.js";

//  GET ALL 
export const getAllChildcare = async () => {
  return await find({
    model: ServiceModel,
    filter: { type: "childcare" },
    select: "name hospitalId"
  });
};

//   GET DETAILS
export const getChildcareDetails = async (id) => {
  return await findById({
    model: ServiceModel,
    id,
    select: "name description hospitalId",
    options: {
      populate: [{ path: "hospitalId", select: "name location" }]
    }
  });
};

//  BOOK
export const bookChildcare = async (userId, serviceId, details) => {

  const service = await findById({
    model: ServiceModel,
    id: serviceId
  });

  if (!service) {
    throw new Error("Service not found");
  }

  //  create booking 
  await createOne({
    model: BookingModel,
    data: {
      userId,
      serviceId,
      hospitalId: service.hospitalId,
      date: new Date(), //  required
      status: "pending"
    }
  });

  // return confirmation
  const hospital = await findById({
    model: HospitalModel,
    id: service.hospitalId,
    select: "name"
  });

  return {
    hospitalName: hospital?.name,
    childName: details.childName,
    phone: details.phone,
    condition: details.condition,
    type: details.type
  };
};
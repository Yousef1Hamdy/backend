import { populate } from "dotenv";
import { NotFoundException, TypeServiceEnum } from "../../common/index.js";
import {
  createOne,
  find,
  findById,
  findByIdAndDelete,
  findByIdAndUpdate,
  findOne,
  HospitalModel,
  ServiceCapacityHistoryModel,
  ServiceModel,
  UserModel,
} from "../../DB/index.js";

export const getAllServices = async () => {
  const services = await find({
    model: ServiceModel,
    options: {
      populate: { path: "hospital", select: "location name" },
    },
  });

  if (!services) {
    throw NotFoundException({ message: "Ù„Ø§ ÙŠÙˆØ¬Ø¯ Ø®Ø¯Ù…Ø§Øª" });
  }

  return services;
};

export const getAllServicesByType = async (type) => {
  const hospitals = await find({
    model: HospitalModel,
    options: {
      populate: {
        path: "services",
        match: { type },
        select: "name type capacity description",
      },
    },
  });

  const filtered = hospitals.filter(
    (hospital) => hospital.services && hospital.services.length > 0,
  );

  if (!filtered.length) {
    throw NotFoundException({ message: "Ù„Ø§ ÙŠÙˆØ¬Ø¯ Ø®Ø¯Ù…Ø§Øª" });
  }

  return filtered;
};

export const createService = async (inputs, type) => {
  const { hospital, name, description, capacity } = inputs;

  const account = await findById({ model: HospitalModel, id: hospital });
  if (!account) {
    throw NotFoundException({ message: "Ø§Ù„Ù…Ø³ØªØ´ÙÙ‰ ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯" });
  }

  const service = await createOne({
    model: ServiceModel,
    data: { hospital, name, type, description, capacity },
  });

  return service;
};

export const getServiceById = async (id) => {
  const service = await findOne({
    model: ServiceModel,
    filter: { _id: id },
    options: {
      populate: { path: "hospital", select: "location name" },
    },
  });

  if (!service) {
    throw NotFoundException({ message: "Ø§Ù„Ø®Ø¯Ù…Ø© ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯Ø©" });
  }
  return service;
};

export const updateService = async (inputs, id) => {
  const service = await findByIdAndUpdate({
    model: ServiceModel,
    id,
    update: { ...inputs },
    options: { new: true, runValidators: true },
  });

  if (!service) {
    throw NotFoundException({ message: "Ø§Ù„Ø®Ø¯Ù…Ù‡ ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯Ø©" });
  }

  return service;
};

export const deleteService = async (id) => {
  const service = await findById({
    model: ServiceModel,
    id,
  });

  if (!service) {
    throw NotFoundException({ message: "Ø§Ù„Ø®Ø¯Ù…Ù‡ ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯Ø©" });
  }

  await findByIdAndDelete({
    model: ServiceModel,
    id,
  });
  await ServiceCapacityHistoryModel.deleteMany({ serviceId: id });

  return { message: "ØªÙ… Ø­Ø°Ù Ø§Ù„Ø®Ø¯Ù…Ù‡ Ø¨Ù†Ø¬Ø§Ø­" };
};

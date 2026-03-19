import { populate } from "dotenv";
import { ConflictException, NotFoundException } from "../../common/index.js";
import {
  createOne,
  deleteOne,
  find,
  findById,
  findByIdAndDelete,
  findOne,
  HospitalModel,
  ServiceModel,
  updateOne,
} from "../../DB/index.js";

export const recordHospital = async (inputs) => {
  const {
    name,
    location: { city, address },
  } = inputs;

  const checkHospitalFound = await findOne({
    model: HospitalModel,
    filter: {
      name,
      city,
    },
  });

  if (checkHospitalFound) {
    throw ConflictException({ message: "hospital already exists" });
  }

  const hospital = await createOne({
    model: HospitalModel,
    data: {
      name,
      location: { city, address },
    },
  });
  return hospital;
};

export const getHospitals = async () => {
  const hospitals = await find({
    model: HospitalModel,
  });

  return hospitals;
};

export const getHospitalById = async (id) => {
  const hospital = await findById({
    model: HospitalModel,
    id,
    options: {
      populate: {
        path: "services",
        select: "name type capacity description",
      },
      lean: true,
    },
  });

  if (!hospital) {
    throw NotFoundException({ message: "المستشفي غير موجوده" });
  }

  return hospital;
};

export const editHospital = async (id, inputs) => {
  const result = await updateOne({
    model: HospitalModel,
    filter: { _id: id },
    update: inputs,
  });

  // المستشفى مش موجودة
  if (result.matchedCount === 0) {
    throw NotFoundException({ message: "المستشفى غير موجودة" });
  }

  // المستشفى موجود بس مفيش أي تغيير حصل
  if (result.matchedCount === 1 && result.modifiedCount === 0) {
    throw new Error("لا يوجد تغييرات جديدة لتحديثها");
  }

  return { message: "تم تحديث المستشفى بنجاح" };
};

export const deleteHospital = async (id) => {
  const hospital = await HospitalModel.findById(id);

  if (!hospital) {
    throw NotFoundException({ message: "المستشفى غير موجودة" });
  }

  await ServiceModel.deleteMany({ hospital: id });

  await HospitalModel.deleteOne({ _id: id });

  return { message: "تم حذف المستشفى بنجاح" };
};

import {
  HospitalModel,
  ServiceModel,
  UserModel
} from "../../DB/index.js";

import {
  createOne,
  deleteOne,
  find,
  findById
} from "../../DB/index.js";

//  ADD HOSPITAL
export const addHospital = async (data) => {
  return await createOne({
    model: HospitalModel,
    data
  });
};

//  DELETE HOSPITAL
export const deleteHospital = async (id) => {
  return await deleteOne({
    model: HospitalModel,
    filter: { _id: id }
  });
};

//  ADD SERVICE
export const addService = async (data) => {
  return await createOne({
    model: ServiceModel,
    data
  });
};

//  DELETE SERVICE
export const deleteService = async (id) => {
  return await deleteOne({
    model: ServiceModel,
    filter: { _id: id }
  });
};

//  GET ALL USERS
export const getUsers = async () => {
  return await find({
    model: UserModel,
    select: "firstName lastName email role"
  });
};

//  DELETE USER
export const deleteUser = async (id) => {
  return await deleteOne({
    model: UserModel,
    filter: { _id: id }
  });
};
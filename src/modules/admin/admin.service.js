import {
  HospitalModel,
  ServiceModel,
  UserModel
} from "../../DB/index.js";

import {
  createModuleRecord,
  deleteModuleRecordById,
  listModuleRecords,
} from "../shared/module.shared.js";

//  ADD HOSPITAL
export const addHospital = async (data) => {
  return await createModuleRecord(HospitalModel, data);
};

//  DELETE HOSPITAL
export const deleteHospital = async (id) => {
  return await deleteModuleRecordById(HospitalModel, id);
};

//  ADD SERVICE
export const addService = async (data) => {
  return await createModuleRecord(ServiceModel, data);
};

//  DELETE SERVICE
export const deleteService = async (id) => {
  return await deleteModuleRecordById(ServiceModel, id);
};

//  GET ALL USERS
export const getUsers = async () => {
  return await listModuleRecords(UserModel, "firstName lastName email role");
};

//  DELETE USER
export const deleteUser = async (id) => {
  return await deleteModuleRecordById(UserModel, id);
};

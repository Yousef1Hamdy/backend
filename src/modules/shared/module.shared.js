import { NotFoundException, generateHash } from "../../common/index.js";
import {
  createOne,
  deleteOne,
  find,
  findById,
  findByIdAndUpdate,
} from "../../DB/index.js";
import { UserModel } from "../../DB/index.js";

export const createModuleRecord = async (model, data) => {
  return await createOne({
    model,
    data,
  });
};

export const deleteModuleRecordById = async (model, id) => {
  return await deleteOne({
    model,
    filter: { _id: id },
  });
};

export const listModuleRecords = async (model, select = "") => {
  return await find({
    model,
    select,
  });
};

export const getModuleRecordById = async ({
  model,
  id,
  select = "",
  options,
  notFoundMessage,
} = {}) => {
  const doc = await findById({
    model,
    id,
    select,
    options,
  });

  if (!doc && notFoundMessage) {
    throw NotFoundException({ message: notFoundMessage });
  }

  return doc;
};

export const updateUserModuleProfile = async (userId, data) => {
  return await findByIdAndUpdate({
    model: UserModel,
    id: userId,
    update: data,
    options: { new: true },
  });
};

export const updateUserModulePassword = async (userId, password) => {
  return await findByIdAndUpdate({
    model: UserModel,
    id: userId,
    update: { password: await generateHash({ plaintext: password }) },
  });
};

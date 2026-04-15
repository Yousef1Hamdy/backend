import { updateUserModulePassword, updateUserModuleProfile } from "../shared/module.shared.js";

//  UPDATE PROFILE
export const updateProfile = async (userId, data) => {
  return await updateUserModuleProfile(userId, data);
};

//  UPDATE PASSWORD
export const updatePassword = async (userId, password) => {
  return await updateUserModulePassword(userId, password);
};

import { UserModel } from "../../DB/index.js";
import { findByIdAndUpdate } from "../../DB/index.js";
import bcrypt from "bcrypt";

//  UPDATE PROFILE
export const updateProfile = async (userId, data) => {
  return await findByIdAndUpdate({
    model: UserModel,
    id: userId,
    update: data,
    options: { new: true }
  });
};

//  UPDATE PASSWORD
export const updatePassword = async (userId, password) => {
  const hashed = await bcrypt.hash(password, 8);

  return await findByIdAndUpdate({
    model: UserModel,
    id: userId,
    update: { password: hashed }
  });
};
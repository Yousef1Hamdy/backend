import {
  ChildcareModel,
  OrderModel
} from "../../DB/index.js";

import { find, findById, createOne } from "../../DB/index.js";

// 📄 list
export const getAllChildcare = async () => {
  return await find({
    model: ChildcareModel
  });
};

// 📄 details
export const getChildcareDetails = async (id) => {
  return await findById({
    model: ChildcareModel,
    id
  });
};

// 🔥 BOOK CHILDCARE
export const bookChildcare = async (userId, childcareId) => {
  return await createOne({
    model: OrderModel,
    data: {
      userId,
      childcareId
    }
  });
};
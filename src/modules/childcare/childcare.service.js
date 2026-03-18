import {
  ChildcareModel,
  OrderModel
} from "../../DB/index.js";

import {
  find,
  findById,
  createOne
} from "../../DB/index.js";

// 🟢 1. GET ALL
export const getAllChildcare = async () => {
  return await find({
    model: ChildcareModel,
    select: "name address",
  });
};

// 🟢 2. GET DETAILS
export const getChildcareDetails = async (id) => {
  return await findById({
    model: ChildcareModel,
    id,
    select: "name address phone nicuAvailable normalAvailable"
  });
};

// 🟢 3. BOOK
export const bookChildcare = async (userId, childcareId, details) => {

  const childcare = await findById({
    model: ChildcareModel,
    id: childcareId
  });

  if (!childcare) {
    throw new Error("Childcare not found");
  }

  // ❗ optional: check availability
  if (
    details.type === "nicu" &&
    childcare.nicuAvailable <= 0
  ) {
    throw new Error("No NICU slots available");
  }

  if (
    details.type === "normal" &&
    childcare.normalAvailable <= 0
  ) {
    throw new Error("No normal slots available");
  }

  // 🟢 create order
  await createOne({
    model: OrderModel,
    data: {
      userId,
      childcareId,
      hospitalName: childcare.name,
      type: details.type,
      childName: details.childName,
      phone: details.phone,
      condition: details.condition
    }
  });

  // ❗ optional: decrease available count
  if (details.type === "nicu") {
    childcare.nicuAvailable -= 1;
  } else {
    childcare.normalAvailable -= 1;
  }

  await childcare.save();

  // 🟢 return confirmation (for Page 4)
  return {
    hospitalName: childcare.name,
    childName: details.childName,
    phone: details.phone,
    condition: details.condition,
    type: details.type
  };
};
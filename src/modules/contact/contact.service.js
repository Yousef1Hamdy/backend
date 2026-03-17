import { ContactModel } from "../../DB/index.js";
import { createOne } from "../../DB/index.js";

export const sendMessage = async ({ userId, email, message }) => {
  return await createOne({
    model: ContactModel,
    data: {
      userId,
      email,
      message
    }
  });
};
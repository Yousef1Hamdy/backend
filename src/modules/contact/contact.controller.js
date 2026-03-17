import { sendMessage } from "./contact.service.js";
import { successResponse } from "../../common/index.js";

export const sendMessageController = async (req, res, next) => {
  const { email, message } = req.body;

  const data = await sendMessage({
    userId: req.user._id,
    email,
    message
  });

  return successResponse({
    res,
    data,
    message: "Message sent successfully"
  });
};
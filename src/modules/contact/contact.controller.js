import { Router } from "express";
import { authentication, validation } from "../../middleware/index.js"; // 🔥 added
import { successResponse } from "../../common/index.js";
import { sendMessage } from "./contact.service.js";

import * as validators from "./contact.validation.js"; // 🔥 added

const router = Router();

router.post(
  "/",
  authentication(),
  validation(validators.sendMessage), // 🔥 added ONLY
  async (req, res, next) => {
    const { email, message } = req.body;

    const contact = await sendMessage({
      userId: req.user._id,
      email,
      message
    });

    return successResponse({
      res,
      message: "Message sent successfully",
      data: { contact } 
    });
  }
);

export default router;
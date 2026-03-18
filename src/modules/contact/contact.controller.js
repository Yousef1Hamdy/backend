import { Router } from "express";
import { authentication } from "../../middleware/index.js";
import { successResponse } from "../../common/index.js";
import { sendMessage } from "./contact.service.js";

const router = Router();

router.post("/", authentication(), async (req, res, next) => {
  const { email, message } = req.body;

  const contact = await sendMessage({
    userId: req.user._id,
    email,
    message
  });

  return successResponse({
    res,
    message: "Message sent successfully",
    data: { contact } // 🔥 wrapped like your friend style
  });
});

export default router;
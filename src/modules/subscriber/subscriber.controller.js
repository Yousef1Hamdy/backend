import { Router } from "express";
import { validation } from "../../middleware/index.js"; // 🔥 added
import { successResponse } from "../../common/index.js";
import { subscribe } from "./subscriber.service.js";

import * as validators from "./subscriber.validation.js"; // 🔥 added

const router = Router();

// SUBSCRIBE
router.post(
  "/",
  validation(validators.subscribe), // 🔥 added ONLY
  async (req, res, next) => {
    const { email } = req.body;

    const subscriber = await subscribe(email);

    return successResponse({
      res,
      message: "Subscribed successfully",
      data: { subscriber }
    });
  }
);

export default router;
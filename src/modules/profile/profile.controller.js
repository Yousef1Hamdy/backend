import { Router } from "express";
import { authentication, validation } from "../../middleware/index.js"; // 🔥 added
import { successResponse } from "../../common/index.js";

import {
  updateProfile,
  updatePassword
} from "./profile.service.js";

import * as validators from "./profile.validation.js"; // 🔥 added

const router = Router();

// UPDATE PROFILE
router.put(
  "/",
  authentication(),
  validation(validators.updateProfile), // 🔥 added ONLY
  async (req, res) => {
    const user = await updateProfile(
      req.user._id,
      req.body
    );

    return successResponse({
      res,
      message: "Profile updated",
      data: { user }
    });
  }
);

// CHANGE PASSWORD
router.put(
  "/password",
  authentication(),
  validation(validators.updatePassword), // 🔥 added ONLY
  async (req, res) => {
    const { password } = req.body;

    await updatePassword(req.user._id, password);

    return successResponse({
      res,
      message: "Password updated"
    });
  }
);

export default router;
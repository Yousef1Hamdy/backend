import { Router } from "express";
import { authentication } from "../../middleware/index.js";
import { successResponse } from "../../common/index.js";

import {
  updateProfile,
  updatePassword
} from "./profile.service.js";

const router = Router();

// UPDATE PROFILE
router.put("/", authentication(), async (req, res) => {
  const user = await updateProfile(
    req.user._id,
    req.body
  );

  return successResponse({
    res,
    message: "Profile updated",
    data: { user }
  });
});

// CHANGE PASSWORD
router.put("/password", authentication(), async (req, res) => {
  const { password } = req.body;

  await updatePassword(req.user._id, password);

  return successResponse({
    res,
    message: "Password updated"
  });
});

export default router;
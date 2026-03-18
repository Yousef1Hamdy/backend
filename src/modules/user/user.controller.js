import { Router } from "express";
import { authentication, authorization } from "../../middleware/index.js";
import { RoleEnum, successResponse } from "../../common/index.js";
import { profile } from "./user.service.js";

const router = Router();
router.get("/", authentication(), async (req, res, next) => {
  const account = await profile(req.user);
  return successResponse({
    res,
    data: { account },
  });
});

export default router;

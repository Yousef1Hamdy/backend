import { Router } from "express";
import { authentication, validation } from "../../middleware/index.js";
import { successResponse } from "../../common/index.js";
import { getHomeData } from "./home.service.js";
import * as validators from "./home.validation.js";

const router = Router();

router.get("/", authentication(), validation(validators.getHome), async (req, res, next) => {
  const data = await getHomeData(req.user._id);

  return successResponse({
    res,
    data: { ...data } 
  });
});

export default router;

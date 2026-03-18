import { Router } from "express";
import { authentication } from "../../middleware/index.js";
import { successResponse } from "../../common/index.js";
import { getHomeData } from "./home.service.js";

const router = Router();

router.get("/", authentication(), async (req, res, next) => {
  const data = await getHomeData(req.user._id);

  return successResponse({
    res,
    data: { ...data } // 🔥 IMPORTANT (same as auth style)
  });
});

export default router;
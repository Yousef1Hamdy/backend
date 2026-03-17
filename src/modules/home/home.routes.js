import { Router } from "express";
import { authentication } from "../../middleware/index.js";
import { getHomeData } from "./home.service.js";

const router = Router();

router.get("/", authentication(), async (req, res) => {
  const data = await getHomeData(req.user._id);
  return successResponse({
      res,
      data
    });
});

export default router;
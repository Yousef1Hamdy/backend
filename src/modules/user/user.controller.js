import { Router } from "express";
import { authentication } from "../../middleware/index.js";
import { successResponse } from "../../common/index.js";
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


/*import { Router } from "express";
import { authentication } from "../../middleware/index.js";
import { successResponse } from "../../common/index.js";
import { profile } from "./user.service.js";

const router = Router();

router.get("/", authentication(), async (req, res) => {
  const account = profile(req.user);

  return successResponse({
    res,
    data: { account }
  });
});

export default router; */
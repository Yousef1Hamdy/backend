import { Router } from "express";
import { successResponse } from "../../common/index.js";
import { subscribe } from "./subscriber.service.js";

const router = Router();

// SUBSCRIBE
router.post("/", async (req, res, next) => {
  const { email } = req.body;

  const subscriber = await subscribe(email);

  return successResponse({
    res,
    message: "Subscribed successfully",
    data: { subscriber }
  });
});

export default router;
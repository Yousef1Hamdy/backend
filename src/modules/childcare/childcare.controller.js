import { Router } from "express";
import { authentication } from "../../middleware/index.js";
import { successResponse } from "../../common/index.js";

import {
  getAllChildcare,
  getChildcareDetails,
  bookChildcare
} from "./childcare.service.js";

const router = Router();

// 🟢 1. GET ALL HOSPITALS (Page 1)
router.get("/", authentication(), async (req, res, next) => {
  const childcare = await getAllChildcare();

  return successResponse({
    res,
    data: { childcare }
  });
});

// 🟢 2. GET DETAILS (Page 2)
router.get("/:id", authentication(), async (req, res, next) => {
  const childcare = await getChildcareDetails(req.params.id);

  return successResponse({
    res,
    data: { childcare }
  });
});

// 🟢 3. BOOK (Page 3 + 4)
router.post("/:id/book", authentication(), async (req, res, next) => {
  const { type, childName, phone, condition } = req.body;

  const order = await bookChildcare(
    req.user._id,
    req.params.id,
    { type, childName, phone, condition }
  );

  return successResponse({
    res,
    message: "Reservation confirmed",
    data: { order }
  });
});

export default router;
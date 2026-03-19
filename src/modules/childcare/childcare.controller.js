import { Router } from "express";
import { authentication } from "../../middleware/index.js";
import { successResponse } from "../../common/index.js";

import {
  getAllChildcare,
  getChildcareDetails,
  bookChildcare
} from "./childcare.service.js";

const router = Router();

// GET ALL HOSPITALS 
router.get("/", authentication(), async (req, res, next) => {
  const childcare = await getAllChildcare();

  return successResponse({
    res,
    data: { childcare }
  });
});

//  GET DETAILS 
router.get("/:id", authentication(), async (req, res, next) => {
  const childcare = await getChildcareDetails(req.params.id);

  return successResponse({
    res,
    data: { childcare }
  });
});

//  BOOK 
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
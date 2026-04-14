import { Router } from "express";
import { authentication, validation } from "../../middleware/index.js";
import { successResponse } from "../../common/index.js";
import { getUserBookings } from "./booking.service.js";
import * as validators from "./booking.validation.js";

const router = Router();

 
router.get("/", authentication(), validation(validators.getBookings), async (req, res) => {
  const bookings = await getUserBookings(req.user._id);

  return successResponse({
    res,
    data: { bookings }
  });
});

export default router;

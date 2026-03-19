import { Router } from "express";
import { authentication } from "../../middleware/index.js";
import { successResponse } from "../../common/index.js";
import { getUserBookings } from "./booking.service.js";

const router = Router();

 
router.get("/", authentication(), async (req, res) => {
  const bookings = await getUserBookings(req.user._id);

  return successResponse({
    res,
    data: { bookings }
  });
});

export default router;
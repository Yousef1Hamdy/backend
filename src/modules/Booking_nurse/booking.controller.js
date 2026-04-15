import { Router } from "express";
import {
  authentication,
  authorization,
  validation,
} from "../../middleware/index.js";
import * as validators from "./booking.validation.js";
import {
  addBooking,
  getBookingById,
  getAllBookings,
  getMyBookings,
  updateBooking,
  deleteBooking,
} from "./booking.service.js";
import { RoleEnum, successResponse } from "../../common/index.js";

const router = Router();

/* =========================================
   1️⃣ Create Booking (Patient)
========================================= */
router.post(
  "/",
  authentication(),
  validation(validators.createBooking),
  async (req, res) => {
    const result = await addBooking(req.body, req.user._id);

    return successResponse({
      res,
      status: 201,
      message: "تم تسجيل الحجز بنجاح",
      data: result,
    });
  },
);

/* =========================================
   2️⃣ Get All Bookings (Admin)
========================================= */
router.get(
  "/",
  authentication(),
  authorization([RoleEnum.Admin, RoleEnum.Hospital, RoleEnum.Nurse]),
  async (req, res) => {
    const result = await getAllBookings(req.query);

    return successResponse({
      res,
      status: 200,
      message: "تم جلب جميع الحجوزات",
      data: result,
    });
  },
);

/* =========================================
   3️⃣ Get My Bookings (Patient)
========================================= */
router.get("/my", authentication(), async (req, res) => {
  const result = await getMyBookings(req.user._id);

  return successResponse({
    res,
    status: 200,
    message: "تم جلب حجوزاتك",
    data: result,
  });
});

/* =========================================
   4️⃣ Get Booking By ID
========================================= */
router.get("/:id", authentication(), async (req, res) => {
  const result = await getBookingById(req.params.id);

  return successResponse({
    res,
    status: 200,
    message: "تم جلب الحجز",
    data: result,
  });
});

/* =========================================
   5️⃣ Update Booking (Patient)
========================================= */
router.put(
  "/:id",
  authentication(),
  validation(validators.updateBooking),
  async (req, res) => {
    const result = await updateBooking(req.params.id, req.user._id, req.body);

    return successResponse({
      res,
      status: 200,
      message: "تم تحديث الحجز",
      data: result,
    });
  },
);

/* =========================================
   6️⃣ Delete Booking (Patient)
========================================= */
router.delete("/:id", authentication(), async (req, res) => {
  const result = await deleteBooking(req.params.id, req.user._id);

  return successResponse({
    res,
    status: 200,
    message: "تم حذف الحجز",
    data: result,
  });
});

export default router;

import { Router } from "express";
import {
  authentication,
  authorization,
  validation,
} from "../../middleware/index.js";
import { RoleEnum, successResponse } from "../../common/index.js";
import {
  getHospitalAccountBookings,
  removeAcceptedHospitalAccountReservation,
} from "./bookings.service.js";
import * as validators from "./bookings.validation.js";
import { getHospitalIdByAccountId } from "../hospitalAccountShared/hospitalAccount.shared.js";

const router = Router();

router.get(
  "/:reservationType/:bookingStatus",
  authentication(),
  authorization([RoleEnum.Hospital]),
  validation(validators.getHospitalBookings),
  async (req, res) => {
    const hospital = await getHospitalIdByAccountId(req.user._id);
    const bookings = await getHospitalAccountBookings(
      hospital._id,
      req.params.reservationType,
      req.params.bookingStatus,
    );

    return successResponse({
      res,
      message: `${req.params.bookingStatus} hospital account bookings`,
      data: { bookings },
    });
  },
);

router.delete(
  "/:reservationType/:reservationId",
  authentication(),
  authorization([RoleEnum.Hospital]),
  validation(validators.removeAcceptedHospitalReservation),
  async (req, res) => {
    const hospital = await getHospitalIdByAccountId(req.user._id);
    const reservation = await removeAcceptedHospitalAccountReservation(
      hospital._id,
      req.params.reservationType,
      req.params.reservationId,
    );

    return successResponse({
      res,
      message: reservation.message,
      data: { reservation },
    });
  },
);

export default router;

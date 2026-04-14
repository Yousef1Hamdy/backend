import { Router } from "express";
import {
  authentication,
  authorization,
  validation,
} from "../../middleware/index.js";
import { RoleEnum, successResponse } from "../../common/index.js";
import {
  getHospitalAccountReservationDetails,
  getHospitalAccountReservations,
  updateHospitalAccountReservationStatus,
} from "./reservations.service.js";
import * as validators from "./reservations.validation.js";
import { getHospitalIdByAccountId } from "../hospitalAccountShared/hospitalAccount.shared.js";

const router = Router();

router.get(
  "/:reservationType",
  authentication(),
  authorization([RoleEnum.Hospital]),
  validation(validators.getHospitalReservations),
  async (req, res) => {
    const hospital = await getHospitalIdByAccountId(req.user._id);
    const reservations = await getHospitalAccountReservations(
      hospital._id,
      req.params.reservationType,
    );

    return successResponse({
      res,
      message: "hospital account reservations",
      data: { reservations },
    });
  },
);

router.get(
  "/:reservationType/:reservationId",
  authentication(),
  authorization([RoleEnum.Hospital]),
  validation(validators.getHospitalReservationDetails),
  async (req, res) => {
    const hospital = await getHospitalIdByAccountId(req.user._id);
    const reservation = await getHospitalAccountReservationDetails(
      hospital._id,
      req.params.reservationType,
      req.params.reservationId,
    );

    return successResponse({
      res,
      message: "hospital account reservation details",
      data: { reservation },
    });
  },
);

router.patch(
  "/:reservationType/:reservationId/status",
  authentication(),
  authorization([RoleEnum.Hospital]),
  validation(validators.updateHospitalReservationStatus),
  async (req, res) => {
    const hospital = await getHospitalIdByAccountId(req.user._id);
    const reservation = await updateHospitalAccountReservationStatus(
      hospital._id,
      req.params.reservationType,
      req.params.reservationId,
      req.body.action,
    );

    return successResponse({
      res,
      message: `reservation ${reservation.status} successfully`,
      data: { reservation },
    });
  },
);

export default router;

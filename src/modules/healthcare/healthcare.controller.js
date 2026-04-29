import { Router } from "express";
import { authentication, validation } from "../../middleware/index.js";
import { successResponse } from "../../common/index.js";
import {
  bookHealthcare,
  getAllHealthcare,
  getHealthcareDetails,
} from "./healthcare.service.js";
import * as validators from "./healthcare.validation.js";

const router = Router();

router.get("/", authentication(), async (req, res) => {
  const healthcare = await getAllHealthcare();

  return successResponse({
    res,
    data: { healthcare },
  });
});

router.get(
  "/:id",
  authentication(),
  validation(validators.healthcareId),
  async (req, res) => {
    const healthcare = await getHealthcareDetails(req.params.id);

    return successResponse({
      res,
      data: { healthcare },
    });
  },
);

router.post(
  "/:id/book",
  authentication(),
  validation(validators.bookHealthcare),
  async (req, res) => {
    const { patientName, phone, condition } = req.body;

    const order = await bookHealthcare(req.user._id, req.params.id, {
      patientName,
      phone,
      condition,
    });

    return successResponse({
      res,
      message: "Reservation confirmed",
      data: { order },
    });
  },
);

export default router;

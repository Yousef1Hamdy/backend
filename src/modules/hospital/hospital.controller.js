import { Router } from "express";
import {
  authentication,
  authorization,
  validation,
} from "../../middleware/index.js";
import { RoleEnum, successResponse } from "../../common/index.js";
import * as validators from "./hospital.validation.js";
import {
  recordHospital,
  getHospitals,
  getHospitalById,
  deleteHospital,
  editHospital,
} from "./hospital.service.js";

const router = Router();

router.get("/", authentication(), async (req, res, next) => {
  const hospitals = await getHospitals(req.body);
  return successResponse({
    res,
    status: 201,
    message: "hospitals",
    data: { hospitals },
  });
});

router.post(
  "/",
  authentication(),
  authorization([RoleEnum.Admin]),
  validation(validators.recordHospital),
  async (req, res, next) => {
    const hospital = await recordHospital(req.body);
    return successResponse({
      res,
      status: 201,
      message: "hospital added successfully",
      data: { hospital },
    });
  },
);

router.get(
  "/:id",
  authentication(),
  validation(validators.hospitalId),
  async (req, res, next) => {
    const hospital = await getHospitalById(req.params.id);
    return successResponse({
      res,
      data: { hospital },
    });
  },
);

router.put(
  "/:id",
  authentication(),
  authorization([RoleEnum.Admin]),
  validation(validators.editHospital),
  async (req, res, next) => {
    const { message } = await editHospital(req.params.id, req.body);
    return successResponse({
      res,
      message,
    });
  },
);

router.delete(
  "/:id",
  authentication(),
  authorization([RoleEnum.Admin]),
  validation(validators.hospitalId),
  async (req, res, next) => {
    const { message } = await deleteHospital(req.params.id);
    return successResponse({
      res,
      message,
    });
  },
);

export default router;

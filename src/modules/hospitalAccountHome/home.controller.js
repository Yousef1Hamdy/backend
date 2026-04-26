import { Router } from "express";
import {
  authentication,
  authorization,
  validation,
} from "../../middleware/index.js";
import { RoleEnum, successResponse } from "../../common/index.js";
import {
  getHospitalAccountHome,
  updateHospitalAccountPlaces,
} from "./home.service.js";
import * as validators from "./home.validation.js";
import { getHospitalIdByAccountId } from "../hospitalAccountShared/hospitalAccount.shared.js";

const router = Router();

router.get(
  "/",
  authentication(),
  authorization([RoleEnum.Hospital]),
  validation(validators.getHospitalAccountHome),
  async (req, res) => {
    const hospital = await getHospitalIdByAccountId(req.user._id);
    const home = await getHospitalAccountHome(hospital._id, req.query);

    return successResponse({
      res,
      message: "hospital account home",
      data: { home },
    });
  },
);

router.patch(
  "/places/:serviceId",
  authentication(),
  authorization([RoleEnum.Hospital]),
  validation(validators.updateHospitalPlacesByAccount),
  async (req, res) => {
    const hospital = await getHospitalIdByAccountId(req.user._id);
    const service = await updateHospitalAccountPlaces(
      hospital._id,
      req.params.serviceId,
      req.body,
    );

    return successResponse({
      res,
      message: "hospital places updated successfully",
      data: { service },
    });
  },
);

router.get(
  "/:hospitalId",
  authentication(),
  authorization([RoleEnum.Admin, RoleEnum.Hospital]),
  validation(validators.getHospitalHome),
  async (req, res) => {
    const home = await getHospitalAccountHome(req.params.hospitalId, req.query);

    return successResponse({
      res,
      message: "hospital account home",
      data: { home },
    });
  },
);

router.get(
  "/landing-page/:hospitalId",
  authentication(),
  authorization([RoleEnum.Admin, RoleEnum.Hospital]),
  validation(validators.getHospitalHome),
  async (req, res) => {
    const landingPage = await getHospitalAccountHome(
      req.params.hospitalId,
      req.query,
    );

    return successResponse({
      res,
      message: "hospital account landing page",
      data: { landingPage },
    });
  },
);

router.patch(
  "/:hospitalId/places/:serviceId",
  authentication(),
  authorization([RoleEnum.Admin, RoleEnum.Hospital]),
  validation(validators.updateHospitalPlaces),
  async (req, res) => {
    const service = await updateHospitalAccountPlaces(
      req.params.hospitalId,
      req.params.serviceId,
      req.body,
    );

    return successResponse({
      res,
      message: "hospital places updated successfully",
      data: { service },
    });
  },
);

export default router;

import { Router } from "express";
import {
  authentication,
  authorization,
  validation,
} from "../../middleware/index.js";
import { RoleEnum, successResponse } from "../../common/index.js";
import {
  changeHospitalPassword,
  getHospitalProfile,
  getHospitalProfilePlaces,
  updateHospitalProfile,
} from "./profile.service.js";
import * as validators from "./profile.validation.js";
import { getHospitalIdByAccountId } from "../hospitalAccountShared/hospitalAccount.shared.js";

const router = Router();

router.get(
  "/",
  authentication(),
  authorization([RoleEnum.Hospital]),
  validation(validators.getHospitalAccountProfile),
  async (req, res) => {
    const hospital = await getHospitalIdByAccountId(req.user._id);
    const profile = await getHospitalProfile(hospital._id, req.user);

    return successResponse({
      res,
      message: "hospital account profile",
      data: { profile },
    });
  },
);

router.get(
  "/places",
  authentication(),
  authorization([RoleEnum.Hospital]),
  validation(validators.getHospitalAccountPlaces),
  async (req, res) => {
    const hospital = await getHospitalIdByAccountId(req.user._id);
    const places = await getHospitalProfilePlaces(hospital._id);

    return successResponse({
      res,
      message: "hospital account places",
      data: { places },
    });
  },
);

router.patch(
  "/",
  authentication(),
  authorization([RoleEnum.Hospital]),
  validation(validators.updateHospitalAccountProfile),
  async (req, res) => {
    const hospital = await getHospitalIdByAccountId(req.user._id);
    const profile = await updateHospitalProfile(
      hospital._id,
      req.user,
      req.body,
    );

    return successResponse({
      res,
      message: "hospital account profile updated",
      data: { profile },
    });
  },
);

router.patch(
  "/password",
  authentication(),
  authorization([RoleEnum.Hospital]),
  validation(validators.changeHospitalAccountPassword),
  async (req, res) => {
    const hospital = await getHospitalIdByAccountId(req.user._id);
    const result = await changeHospitalPassword(
      hospital._id,
      req.user,
      req.body,
    );

    return successResponse({
      res,
      message: result.message,
    });
  },
);

export default router;

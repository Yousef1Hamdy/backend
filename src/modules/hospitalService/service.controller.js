import { Router } from "express";
import {
  authentication,
  authorization,
  validation,
} from "../../middleware/index.js";
import {
  RoleEnum,
  successResponse,
  TypeServiceEnum,
} from "../../common/index.js";
import {
  createService,
  deleteService,
  getAllServices,
  getAllServicesByType,
  getServiceById,
  updateService,
} from "./service.service.js";
import * as validators from "./service.validation.js";

const router = Router();

router.post(
  "/nursery",
  authentication(),
  authorization([RoleEnum.Hospital, RoleEnum.Admin]),
  validation(validators.CreateService),
  async (req, res, next) => {
    const result = await createService(req.body, TypeServiceEnum.Nursery);
    return successResponse({
      res,
      status: 201,
      data: { result },
    });
  },
);

router.post(
  "/care",
  authentication(),
  authorization([RoleEnum.Hospital, RoleEnum.Admin]),
  validation(validators.CreateService),
  async (req, res, next) => {
    const result = await createService(req.body, TypeServiceEnum.Care);
    return successResponse({
      res,
      status: 201,
      data: { result },
    });
  },
);
router.post(
  "/clinic",
  authentication(),
  authorization([RoleEnum.Hospital, RoleEnum.Admin]),
  validation(validators.CreateService),
  async (req, res, next) => {
    const result = await createService(req.body, TypeServiceEnum.Clinic);
    return successResponse({
      res,
      status: 201,
      data: { result },
    });
  },
);

router.get("/", authentication(), async (req, res, next) => {
  const services = await getAllServices();
  return successResponse({
    res,
    data: { services },
  });
});

router.get("/nursery", authentication(), async (req, res, next) => {
  const services = await getAllServicesByType(TypeServiceEnum.Nursery);
  return successResponse({
    res,
    data: { services },
  });
});

router.get("/care", authentication(), async (req, res, next) => {
  const services = await getAllServicesByType(TypeServiceEnum.Care);
  return successResponse({
    res,
    data: { services },
  });
});

router.get("/clinic", authentication(), async (req, res, next) => {
  const services = await getAllServicesByType(TypeServiceEnum.Clinic);
  return successResponse({
    res,
    data: { services },
  });
});

router.get(
  "/:id",
  authentication(),
  validation(validators.serviceId),
  async (req, res, next) => {
    const service = await getServiceById(req.params.id);
    return successResponse({
      res,
      status: 200,
      data: { service },
    });
  },
);

router.put(
  "/:id",
  authentication(),
  authorization([RoleEnum.Admin, RoleEnum.Hospital]),
  validation(validators.updateService),
  async (req, res, next) => {
    const service = await updateService(req.body, req.params.id);
    return successResponse({
      res,
      data: { service },
    });
  },
);

router.delete(
  "/:id",
  authentication(),
  authorization([RoleEnum.Admin, RoleEnum.Hospital]),
  validation(validators.serviceId),
  async (req, res, next) => {
    const { message } = await deleteService(req.params.id);
    return successResponse({
      res,
      message,
    });
  },
);

export default router;

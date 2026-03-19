import { Router } from "express";
import { successResponse } from "../../common/index.js";
import { authentication } from "../../middleware/index.js";
import { authorization } from "../../middleware/authorization.middleware.js";
import { RoleEnum } from "../../common/index.js";

import {
  addHospital,
  deleteHospital,
  addService,
  deleteService,
  getUsers,
  deleteUser
} from "./admin.service.js";

const router = Router();


router.use(authentication(), authorization([RoleEnum.Admin]));

// GET USERS
router.get("/users", async (req, res) => {
  const users = await getUsers();

  return successResponse({
    res,
    data: { users }
  });
});

//  DELETE USER
router.delete("/user/:id", async (req, res) => {
  await deleteUser(req.params.id);

  return successResponse({
    res,
    message: "User deleted"
  });
});

//  ADD HOSPITAL
router.post("/hospital", async (req, res) => {
  const hospital = await addHospital(req.body);

  return successResponse({
    res,
    message: "Hospital added",
    data: { hospital }
  });
});

//  DELETE HOSPITAL
router.delete("/hospital/:id", async (req, res) => {
  await deleteHospital(req.params.id);

  return successResponse({
    res,
    message: "Hospital deleted"
  });
});

// ADD SERVICE
router.post("/service", async (req, res) => {
  const service = await addService(req.body);

  return successResponse({
    res,
    message: "Service added",
    data: { service }
  });
});

//  DELETE SERVICE
router.delete("/service/:id", async (req, res) => {
  await deleteService(req.params.id);

  return successResponse({
    res,
    message: "Service deleted"
  });
});

export default router;
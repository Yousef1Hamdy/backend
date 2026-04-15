import { Router } from "express";
import { successResponse } from "../../common/index.js";
import { authentication } from "../../middleware/index.js";
import { authorization } from "../../middleware/authorization.middleware.js";
import { RoleEnum } from "../../common/index.js";
import { validation } from "../../middleware/index.js";
import * as validators from "./admin.validation.js";

import {
  addHospital,
  addManagedUser,
  deleteHospital,
  addService,
  deleteService,
  getUsers,
  deleteUser,
  updateHospital,
  updateManagedUser,
  updateService,
} from "./admin.service.js";

const router = Router();


router.use(authentication(), authorization([RoleEnum.Admin]));

// GET USERS
router.get("/users", validation(validators.listUsers), async (req, res) => {
  const users = await getUsers(
    req.query.role === undefined ? undefined : Number(req.query.role),
  );

  return successResponse({
    res,
    data: { users }
  });
});

router.post("/user", validation(validators.addManagedUser), async (req, res) => {
  const user = await addManagedUser(req.body);

  return successResponse({
    res,
    status: 201,
    message: "User added",
    data: { user },
  });
});

router.patch("/user/:id", validation(validators.updateManagedUser), async (req, res) => {
  const user = await updateManagedUser(req.params.id, req.body);

  return successResponse({
    res,
    message: "User updated",
    data: { user },
  });
});

//  DELETE USER
router.delete("/user/:id", validation(validators.deleteEntityById), async (req, res) => {
  await deleteUser(req.params.id);

  return successResponse({
    res,
    message: "User deleted"
  });
});

//  ADD HOSPITAL
router.post("/hospital", validation(validators.addHospital), async (req, res) => {
  const { hospital, partner, user } = await addHospital(req.body);

  return successResponse({
    res,
    message: "Hospital added",
    data: { hospital, partner, user }
  });
});

router.patch("/hospital/:id", validation(validators.updateHospital), async (req, res) => {
  const result = await updateHospital(req.params.id, req.body);

  return successResponse({
    res,
    message: "Hospital updated",
    data: result,
  });
});

//  DELETE HOSPITAL
router.delete("/hospital/:id", validation(validators.deleteEntityById), async (req, res) => {
  const result = await deleteHospital(req.params.id);

  return successResponse({
    res,
    message: result.message
  });
});

// ADD SERVICE
router.post("/service", validation(validators.addService), async (req, res) => {
  const service = await addService(req.body);

  return successResponse({
    res,
    message: "Service added",
    data: { service }
  });
});

//  DELETE SERVICE
router.delete("/service/:id", validation(validators.deleteEntityById), async (req, res) => {
  const result = await deleteService(req.params.id);

  return successResponse({
    res,
    message: result.message
  });
});

router.patch("/service/:id", validation(validators.updateService), async (req, res) => {
  const service = await updateService(req.params.id, req.body);

  return successResponse({
    res,
    message: "Service updated",
    data: { service },
  });
});

export default router;

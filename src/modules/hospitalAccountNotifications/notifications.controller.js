import { Router } from "express";
import {
  authentication,
  authorization,
  validation,
} from "../../middleware/index.js";
import { RoleEnum, successResponse } from "../../common/index.js";
import { getHospitalIdByAccountId } from "../hospitalAccountShared/hospitalAccount.shared.js";
import {
  getHospitalNotifications,
  markAllHospitalNotificationsAsRead,
  markHospitalNotificationAsRead,
  subscribeToHospitalNotifications,
  unsubscribeFromHospitalNotifications,
} from "./notifications.service.js";
import * as validators from "./notifications.validation.js";

const router = Router();

router.get(
  "/",
  authentication(),
  authorization([RoleEnum.Hospital]),
  validation(validators.getHospitalNotifications),
  async (req, res) => {
    const hospital = await getHospitalIdByAccountId(req.user._id);
    const notifications = await getHospitalNotifications(hospital._id);

    return successResponse({
      res,
      message: "hospital account notifications",
      data: { notifications },
    });
  },
);

router.get(
  "/stream",
  authentication(),
  authorization([RoleEnum.Hospital]),
  async (req, res) => {
    const hospital = await getHospitalIdByAccountId(req.user._id);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    await subscribeToHospitalNotifications(hospital._id, res);

    const keepAlive = setInterval(() => {
      res.write("event: ping\ndata: {}\n\n");
    }, 25000);

    req.on("close", () => {
      clearInterval(keepAlive);
      unsubscribeFromHospitalNotifications(hospital._id, res);
      res.end();
    });
  },
);

router.patch(
  "/:notificationId/read",
  authentication(),
  authorization([RoleEnum.Hospital]),
  validation(validators.markHospitalNotificationAsRead),
  async (req, res) => {
    const hospital = await getHospitalIdByAccountId(req.user._id);
    const notification = await markHospitalNotificationAsRead(
      hospital._id,
      req.params.notificationId,
    );

    return successResponse({
      res,
      message: "notification marked as read",
      data: { notification },
    });
  },
);

router.patch(
  "/read-all",
  authentication(),
  authorization([RoleEnum.Hospital]),
  validation(validators.markAllHospitalNotificationsAsRead),
  async (req, res) => {
    const hospital = await getHospitalIdByAccountId(req.user._id);
    const result = await markAllHospitalNotificationsAsRead(hospital._id);

    return successResponse({
      res,
      message: result.message,
    });
  },
);

export default router;

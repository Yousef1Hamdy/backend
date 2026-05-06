import { Router } from "express";
import {
  authentication,
  authorization,
  validation,
} from "../../middleware/index.js";
import {
  cloudFileUpload,
  fileFieldValidation,
  RoleEnum,
  successResponse,
  TokenTypeEnum,
} from "../../common/index.js";
import {
  logout,
  profile,
  profileImage,
  rotateToken,
  shareProfile,
  updatePassword,
} from "./user.service.js";
import {
  getUserNotifications,
  markAllUserNotificationsAsRead,
  markUserNotificationAsRead,
  subscribeToUserNotifications,
  unsubscribeFromUserNotifications,
} from "./user.notifications.service.js";
import { endpoint } from "./user.authorization.js";
import * as validators from "./user.validation.js";

const router = Router();
router.get(
  "/profile",
  authentication(),
  async (req, res, next) => {
    const account = await profile(req.user);
    return successResponse({
      res,
      data: { account },
    });
  },
);

router.patch(
  "/profile-image",
  authentication(),
  cloudFileUpload({
    validation: fileFieldValidation.image,
  }).single("attachment"),
  validation(validators.profileImage),
  async (req, res, next) => {
    const account = await profileImage(req.file, req.user);
    return successResponse({
      res,
      data: { account },
    });
  },
);

router.get(
  "/:userId/share-profile",
  validation(validators.shareProfile),
  async (req, res, next) => {
    const userId = req.params.userId;
    const account = await shareProfile(userId);

    return res.status(200).json({ message: "Profile", account });
  },
);

router.post(
  "/rotate-token",
  authentication(TokenTypeEnum.refresh),
  async (req, res, next) => {
    const credentials = await rotateToken(
      req.user,
      req.decoded,
      `${req.protocol}://${req.host}`,
    );
    return successResponse({
      res,
      status: 201,
      message: "",
      data: { ...credentials },
    });
  },
);

router.post(
  "/update-password",
  authentication(),
  validation(validators.updatePassword),
  async (req, res, next) => {
    const credentials = await updatePassword(
      req.body,
      req.user,
      `${req.protocol}://${req.host}`,
    );

    return successResponse({ res, data: credentials });
  },
);

router.post("/logout", authentication(), async (req, res, next) => {
  const status = await logout(req.body, req.user, req.decoded);

  return successResponse({ res, status });
});

router.get(
  "/notifications",
  authentication(),
  validation(validators.getUserNotifications),
  async (req, res) => {
    const notifications = await getUserNotifications(req.user._id);

    return successResponse({
      res,
      message: "user notifications",
      data: { notifications },
    });
  },
);

router.get("/notifications/stream", authentication(), async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  await subscribeToUserNotifications(req.user._id, res);

  const keepAlive = setInterval(() => {
    res.write("event: ping\ndata: {}\n\n");
  }, 25000);

  req.on("close", () => {
    clearInterval(keepAlive);
    unsubscribeFromUserNotifications(req.user._id, res);
    res.end();
  });
});

router.patch(
  "/notifications/:notificationId/read",
  authentication(),
  validation(validators.markUserNotificationAsRead),
  async (req, res) => {
    const notification = await markUserNotificationAsRead(
      req.user._id,
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
  "/notifications/read-all",
  authentication(),
  validation(validators.markAllUserNotificationsAsRead),
  async (req, res) => {
    const result = await markAllUserNotificationsAsRead(req.user._id);

    return successResponse({
      res,
      message: result.message,
    });
  },
);

export default router;

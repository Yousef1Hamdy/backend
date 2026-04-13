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
import { endpoint } from "./user.authorization.js";
import * as validators from "./user.validation.js";

const router = Router();
router.get(
  "/profile",
  authentication(),
  authorization(endpoint.profile),
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

export default router;

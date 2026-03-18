import { Router } from "express";
import { successResponse } from "../../common/index.js";
import {
  signup,
  login,
  confirmEmail,
  resendConfirmEmail,
  requestForgotPasswordOtp,
  verifyForgotPasswordOtp,
  resetForgotPasswordOtp,
} from "./auth.service.js";
import { validation } from "../../middleware/index.js";
import * as validators from "./auth.validation.js";

const router = Router();

router.post(
  "/signup",
  validation(validators.signup),
  async (req, res, next) => {
    const user = await signup(req.body);
    return successResponse({
      res,
      status: 201,
      message: "User created successfully",
    });
  },
);

router.patch(
  "/confirm-email",
  validation(validators.confirmEmail),
  async (req, res, next) => {
    const { message } = await confirmEmail(req.body);

    return successResponse({
      res,
      message,
    });
  },
);

router.patch(
  "/resend-confirm-email",
  validation(validators.resendConfirmEmail),
  async (req, res, next) => {
    const message = await resendConfirmEmail(req.body);

    return successResponse({
      res,
      message,
    });
  },
);

router.post(
  "/request_forgot_password",
  validation(validators.resendConfirmEmail),
  async (req, res, next) => {
    const message = await requestForgotPasswordOtp(req.body);

    return successResponse({
      res,
      status: 201,
    });
  },
);

router.patch(
  "/verify_forgot_password",
  validation(validators.confirmEmail),
  async (req, res, next) => {
    const message = await verifyForgotPasswordOtp(req.body);

    return successResponse({
      res,
    });
  },
);

router.patch(
  "/reset_forgot_password",
  validation(validators.resetForgotPassword),
  async (req, res, next) => {
    const message = await resetForgotPasswordOtp(req.body);

    return successResponse({
      res,
    });
  },
);

router.post("/login", validation(validators.login), async (req, res, next) => {
  const protocol = req.protocol; // http أو https
  const host = req.get("host");
  const issuer = `${protocol}://${host}`;

  const credentials = await login(req.body, issuer);
  return successResponse({
    res,
    message: "Done Login",
    data: { ...credentials },
  });
});

export default router;

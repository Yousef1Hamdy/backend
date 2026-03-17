import { Router } from "express";
import { authentication } from "../../middleware/index.js";
import {
  getAllChildcareController,
  getChildcareDetailsController,
  bookChildcareController
} from "./childcare.controller.js";

const router = Router();

router.get("/", authentication(), getAllChildcareController);
router.get("/:id", authentication(), getChildcareDetailsController);
router.post("/:id/book", authentication(), bookChildcareController);

export default router; // 🔥 VERY IMPORTANT
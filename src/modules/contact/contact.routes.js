import { Router } from "express";
import { authentication } from "../../middleware/index.js";
import { sendMessageController } from "./contact.controller.js";

const router = Router();

router.post("/", authentication(), sendMessageController);

export default router;
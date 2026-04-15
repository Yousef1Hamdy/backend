import express from "express";
import cors from "cors";
import { PORT } from "../config/config.service.js";
import { globalErrorHandling } from "./common/index.js";
import { authentication, connectRedis } from "./DB/index.js";
import { authRouter } from "./modules/auth/index.js";
import { userRouter } from "./modules/user/index.js";
import { homeRouter } from "./modules/home/index.js";
import { childcareRouter } from "./modules/childcare/index.js";
import { contactRouter } from "./modules/contact/index.js";
import { adminRouter } from "./modules/admin/index.js";
import { subscriberRouter } from "./modules/subscriber/index.js";
import { profileRouter } from "./modules/profile/index.js";
import {
  BookingStaffRouter,
  hospitalRouter,
  serviceRouter,
} from "./modules/index.js";
import { bookingRouter } from "./modules/booking/index.js";
import { hospitalAccountHomeRouter } from "./modules/hospitalAccountHome/index.js";
import { hospitalAccountReservationsRouter } from "./modules/hospitalAccountReservations/index.js";
import { hospitalAccountBookingsRouter } from "./modules/hospitalAccountBookings/index.js";
import { hospitalAccountProfileRouter } from "./modules/hospitalAccountProfile/index.js";
import { hospitalAccountNotificationsRouter } from "./modules/hospitalAccountNotifications/index.js";

async function bootstrap() {
  const app = express();

  app.use(cors(), express.json());

  //   connecting DB
  await authentication();
  await connectRedis();

  //application routing
  app.get("/", (req, res) => {
    return res.send("Hello World");
  });
  app.use("/auth", authRouter);
  app.use("/user", userRouter);
  app.use("/home", homeRouter);
  app.use("/childcare", childcareRouter);
  app.use("/contact", contactRouter);
  app.use("/admin", adminRouter);
  app.use("/subscribe", subscriberRouter);
  app.use("/profile", profileRouter);
  app.use("/booking", bookingRouter);

  app.use("/booking-staff", BookingStaffRouter);

  app.use("/hospital-account/home", hospitalAccountHomeRouter);
  app.use("/hospital-account/reservations", hospitalAccountReservationsRouter);
  app.use("/hospital-account/bookings", hospitalAccountBookingsRouter);
  app.use("/hospital-account/profile", hospitalAccountProfileRouter);
  app.use(
    "/hospital-account/notifications",
    hospitalAccountNotificationsRouter,
  );

  //invalid routing
  app.use("/hospitals", hospitalRouter);
  app.use("/services", serviceRouter);

  //invalid routing
  app.use("{/*dummy}", (req, res) => {
    return res.status(404).json({ message: "Invalid application routing" });
  });

  //   Error handling
  app.use(globalErrorHandling);

  app.listen(PORT, () => console.log(`Example app listening on port ${PORT}!`));
}

export default bootstrap;

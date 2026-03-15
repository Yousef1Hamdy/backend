import express from "express";
import cors from "cors";
import { PORT } from "../config/config.service.js";
import { globalErrorHandling } from "./common/index.js";
import { authentication, connectRedis } from "./DB/index.js";
import { authRouter } from "./modules/auth/index.js";
import { userRouter } from "./modules/user/index.js";
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

  //invalid routing
  app.use("{/*dummy}", (req, res) => {
    return res.status(404).json({ message: "Invalid application routing" });
  });
  
  //   Error handling
  app.use(globalErrorHandling);

  app.listen(PORT, () => console.log(`Example app listening on port ${PORT}!`));
}

export default bootstrap;

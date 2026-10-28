import { Router } from "express";
import { authRouter } from "./auth.routes.js";
import { userRouter } from "./user.routes.js";
import { eventRouter } from "./event.routes.js";
import { categoryRouter } from "./category.routes.js";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/users", userRouter);
apiRouter.use("/events", eventRouter);
apiRouter.use("/categories", categoryRouter);

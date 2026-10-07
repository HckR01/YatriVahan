import { Router } from "express";
import { adminRouter } from "./admin.routes.js";
import { bookingsRouter } from "./bookings.routes.js";
import { groupsRouter } from "./groups.routes.js";
import { notificationsRouter } from "./notifications.routes.js";
import { profilesRouter } from "./profiles.routes.js";
import { ridesRouter } from "./rides.routes.js";
import { vehiclesRouter } from "./vehicles.routes.js";

export const apiRouter = Router();
apiRouter.use("/admin", adminRouter);

apiRouter.use("/profiles", profilesRouter);
apiRouter.use("/vehicles", vehiclesRouter);
apiRouter.use("/rides", ridesRouter);
apiRouter.use("/bookings", bookingsRouter);
apiRouter.use("/groups", groupsRouter);
apiRouter.use("/notifications", notificationsRouter);


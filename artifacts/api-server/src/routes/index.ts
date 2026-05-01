import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import mealsRouter from "./meals";
import ngoRouter from "./ngo";
import residentsRouter from "./residents";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(mealsRouter);
router.use(ngoRouter);
router.use(residentsRouter);
router.use(dashboardRouter);

export default router;

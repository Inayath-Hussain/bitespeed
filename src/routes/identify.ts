import { Router } from "express";
import { validateIdentifyBody } from "../middlewares/validateIdentifyBody";
import { identifyController } from "../controllers/identifyController";

const router = Router();

router.post("/", validateIdentifyBody, identifyController);

export { router as mainRouter }
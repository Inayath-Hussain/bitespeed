import { Router } from "express";
import { validateIdentifyBody } from "../middlewares/validateIdentifyBody";

const router = Router();

router.post("/", validateIdentifyBody)

export { router as mainRouter }
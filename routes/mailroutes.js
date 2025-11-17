import express from "express";
import { sendReservationEmail } from "../controllers/mailController.js";

const router = express.Router();

router.post("/send", sendReservationEmail);

export default router;
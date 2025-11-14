import express from "express";
import { makeReservation, confirmReservation, releaseSeat } from "../controllers/reservationController.js";

const router = express.Router();

router.post("/reserve", makeReservation);
router.post("/confirm", confirmReservation);
router.post("/release", releaseSeat);

export default router;

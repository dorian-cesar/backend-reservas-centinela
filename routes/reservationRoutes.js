import express from "express";
import { makeReservation } from "../controllers/reservationController.js";
import { protect } from "../middleware/authMiddleware.js";
const router = express.Router();

router.post("/", protect, makeReservation);

export default router;

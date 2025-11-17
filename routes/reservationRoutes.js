import express from "express";
import { makeReservation, confirmReservation, releaseSeat, releaseSeatWithTimeValidation, getUserActiveReservations, getUserReservationHistory } from "../controllers/reservationController.js";
import {generateTicketPdf} from "../controllers/generateTicketPdf.js";

const router = express.Router();

router.post("/reserve", makeReservation);
router.post("/confirm", confirmReservation);
router.post("/release", releaseSeat);

router.post("/release-seat", releaseSeatWithTimeValidation); // Liberación con validación de 48h
router.get("/user/:userId/active", getUserActiveReservations);    // Solo reservas activas
router.get("/user/:userId/history", getUserReservationHistory); // Historial completo
router.get('/ticket/:reservationId', generateTicketPdf);
export default router;

import express from "express";
import { makeReservation, confirmReservation, releaseSeat, releaseSeatWithTimeValidation, getUserActiveReservations, getUserReservationHistory } from "../controllers/reservationController.js";

const router = express.Router();

/**
 * @swagger
 * /reserve:
 *   post:
 *     summary: Crea una nueva reserva.
 *     description: Permite a un usuario realizar una reserva de asiento.
 *     tags:
 *       - Reservas
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               seatId:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Reserva creada exitosamente.
 *       400:
 *         description: Datos inválidos o asiento no disponible.
 */
/**
 * Realiza una reserva de asiento para un usuario.
 * @function
 * @name POST /reserve
 * @memberof router
 */
router.post("/reserve", makeReservation);

/**
 * @swagger
 * /confirm:
 *   post:
 *     summary: Confirma una reserva existente.
 *     description: Permite a un usuario confirmar una reserva previamente realizada.
 *     tags:
 *       - Reservas
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reservationId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reserva confirmada exitosamente.
 *       404:
 *         description: Reserva no encontrada.
 */
/**
 * Confirma una reserva existente.
 * @function
 * @name POST /confirm
 * @memberof router
 */
router.post("/confirm", confirmReservation);

/**
 * @swagger
 * /release:
 *   post:
 *     summary: Libera un asiento reservado.
 *     description: Permite a un usuario liberar un asiento previamente reservado.
 *     tags:
 *       - Reservas
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reservationId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Asiento liberado exitosamente.
 *       404:
 *         description: Reserva no encontrada.
 */
/**
 * Libera un asiento reservado por el usuario.
 * @function
 * @name POST /release
 * @memberof router
 */
router.post("/release", releaseSeat);

/**
 * @swagger
 * /release-seat:
 *   post:
 *     summary: Libera un asiento con validación de tiempo.
 *     description: Libera un asiento reservado solo si han pasado menos de 48 horas desde la reserva.
 *     tags:
 *       - Reservas
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reservationId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Asiento liberado exitosamente.
 *       400:
 *         description: No se puede liberar el asiento después de 48 horas.
 */
/**
 * Libera un asiento reservado, validando que no hayan pasado más de 48 horas desde la reserva.
 * @function
 * @name POST /release-seat
 * @memberof router
 */
router.post("/release-seat", releaseSeatWithTimeValidation);

/**
 * @swagger
 * /user/{userId}/active:
 *   get:
 *     summary: Obtiene las reservas activas de un usuario.
 *     description: Devuelve todas las reservas activas asociadas a un usuario específico.
 *     tags:
 *       - Reservas
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario.
 *     responses:
 *       200:
 *         description: Lista de reservas activas.
 *       404:
 *         description: Usuario no encontrado o sin reservas activas.
 */
/**
 * Obtiene todas las reservas activas de un usuario.
 * @function
 * @name GET /user/:userId/active
 * @memberof router
 */
router.get("/user/:userId/active", getUserActiveReservations);

/**
 * @swagger
 * /user/{userId}/history:
 *   get:
 *     summary: Obtiene el historial de reservas de un usuario.
 *     description: Devuelve el historial completo de reservas (activas e inactivas) de un usuario.
 *     tags:
 *       - Reservas
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario.
 *     responses:
 *       200:
 *         description: Historial de reservas.
 *       404:
 *         description: Usuario no encontrado o sin historial de reservas.
 */
/**
 * Obtiene el historial completo de reservas de un usuario.
 * @function
 * @name GET /user/:userId/history
 * @memberof router
 */
router.get("/user/:userId/history", getUserReservationHistory);

export default router;

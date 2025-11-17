import express from "express";
import { sendReservationEmail } from "../controllers/mailController.js";

/**
 * @swagger
 * tags:
 *   name: Mail
 *   description: Endpoints para el envío de correos electrónicos relacionados con reservas
 */

const router = express.Router();

/**
 * @swagger
 * /send:
 *   post:
 *     summary: Enviar correo de confirmación de reserva
 *     tags: [Mail]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: Correo electrónico del destinatario
 *               reservationDetails:
 *                 type: object
 *                 description: Detalles de la reserva
 *             required:
 *               - email
 *               - reservationDetails
 *     responses:
 *       200:
 *         description: Correo enviado exitosamente
 *       400:
 *         description: Solicitud inválida
 *       500:
 *         description: Error interno del servidor
 */

/**
 * Define la ruta para enviar un correo de confirmación de reserva.
 *
 * @route POST /send
 * @group Mail - Operaciones relacionadas con el envío de correos
 * @param {object} req.body - Objeto con los datos necesarios para el envío del correo
 * @param {string} req.body.email - Correo electrónico del destinatario
 * @param {object} req.body.reservationDetails - Detalles de la reserva
 * @returns {object} 200 - Correo enviado exitosamente
 * @returns {Error}  400 - Solicitud inválida
 * @returns {Error}  500 - Error interno del servidor
 */
router.post("/send", sendReservationEmail);

export default router;
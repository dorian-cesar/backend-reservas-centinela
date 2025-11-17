import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";
dotenv.config();
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
/**
 * @swagger
 * /api/mail/send:
 *   post:
 *     summary: Envía un correo electrónico de confirmación de reserva utilizando SendGrid.
 *     description: >
 *       Envía un correo electrónico al usuario con los detalles de la reserva utilizando una plantilla dinámica de SendGrid.
 *     tags:
 *       - Correos
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - to
 *             properties:
 *               to:
 *                 type: string
 *                 format: email
 *                 description: Correo electrónico del destinatario.
 *               reservation_number:
 *                 type: string
 *                 description: Número de reserva.
 *               origin:
 *                 type: string
 *                 description: Ciudad de origen.
 *               destination:
 *                 type: string
 *                 description: Ciudad de destino.
 *               bus_company:
 *                 type: string
 *                 description: Nombre de la empresa de buses.
 *               travel_date:
 *                 type: string
 *                 format: date
 *                 description: Fecha del viaje.
 *               departure_time:
 *                 type: string
 *                 description: Hora de salida.
 *               ticket_url:
 *                 type: string
 *                 format: uri
 *                 description: URL del boleto electrónico.
 *     responses:
 *       200:
 *         description: Correo enviado correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Correo enviado correctamente
 *       400:
 *         description: Faltan datos obligatorios en la solicitud.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: El campo 'to' es obligatorio
 *       500:
 *         description: Error interno al enviar el correo.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Error enviando correo
 *                 error:
 *                   type: string
 *                   example: Descripción del error
 */
/**
 * Envía un correo electrónico de confirmación de reserva utilizando SendGrid.
 *
 * @async
 * @function sendReservationEmail
 * @param {import('express').Request} req - Objeto de solicitud de Express, debe contener en el body los datos de la reserva.
 * @param {import('express').Response} res - Objeto de respuesta de Express.
 * @returns {Promise<void>} Retorna una respuesta JSON indicando el resultado del envío del correo.
 */
export const sendReservationEmail = async (req, res) => {
    const {
        to,
        reservation_number,
        origin,
        destination,
        bus_company,
        travel_date,
        departure_time,
        ticket_url,
    } = req.body;

    if (!to) {
        return res.status(400).json({ message: "El campo 'to' es obligatorio" });
    }

    const msg = {
        to,
        from: "viajes@pullmanbus.cl", // Cambia por tu email verificado en SendGrid
        templateId: "d-7be85246160348a490780c74d686991a",
        dynamicTemplateData: {
            reservation_number,
            origin,
            destination,
            bus_company,
            travel_date,
            departure_time,
            ticket_url,
        },
    };

    try {
        await sgMail.send(msg);
        res.json({ message: "Correo enviado correctamente" });
    } catch (error) {
        console.error("Error enviando correo:", error);
        res.status(500).json({ message: "Error enviando correo", error: error.message });
    }
};
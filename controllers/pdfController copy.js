import { generateReservationPDF } from '../services/pdfService.js';
import Reservation from '../models/Reservation.js';

export const downloadReservationPDF = async (req, res) => {
    try {
        const { reservationId } = req.params;

        if (!reservationId) {
            return res.status(400).json({ message: "reservationId es requerido" });
        }

        // Buscar y poblar la reserva
        const reservation = await Reservation.findById(reservationId)
            .populate("user", "name email rut")
            .populate("service", "origin destination date");

        if (!reservation) {
            return res.status(404).json({ message: "Reserva no encontrada" });
        }

        // Verificar que la reserva esté confirmada
        if (reservation.status !== 'confirmed') {
            return res.status(400).json({ message: "La reserva no está confirmada" });
        }

        // Generar PDF
        const pdfBase64 = await generateReservationPDF(reservation);

        // Opción 1: Devolver como JSON con base64 (para el frontend)
        if (req.query.format === 'json') {
            return res.json({
                success: true,
                pdf: `data:application/pdf;base64,${pdfBase64}`,
                filename: `pasaje-${reservation._id}.pdf`
            });
        }

        // Opción 2: Descarga directa (para el botón del correo)
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="pasaje-${reservation._id}.pdf"`);

        const pdfBuffer = Buffer.from(pdfBase64, 'base64');
        res.send(pdfBuffer);

    } catch (error) {
        console.error('Error generando PDF:', error);
        res.status(500).json({ message: "Error interno generando PDF" });
    }
};
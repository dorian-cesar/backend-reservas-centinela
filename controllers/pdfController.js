import { generateReservationPDF } from '../services/pdfService.js';
import Reservation from '../models/Reservation.js';

export const downloadReservationPDF = async (req, res) => {
    try {
        const { reservationId } = req.params;

        if (!reservationId) {
            return res.status(400).json({ message: "reservationId es requerido" });
        }

        // Validar formato del ID
        if (!reservationId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: "ID de reserva inválido" });
        }

        // Buscar y poblar la reserva
        const reservation = await Reservation.findById(reservationId)
            .populate("user", "name email rut")
            .populate({
                path: "service",
                select: "origin destination date template",
                populate: {
                    path: "template",
                    model: "ServiceTemplate",
                    select: "time"
                }
            });

        if (!reservation) {
            return res.status(404).json({ message: "Reserva no encontrada" });
        }

        // Verificar que la reserva esté confirmada
        if (reservation.status !== 'confirmed') {
            return res.status(400).json({ message: "La reserva no está confirmada" });
        }

        // Generar PDF (ahora devuelve Buffer directamente)
        const pdfBuffer = await generateReservationPDF(reservation);

        if (!pdfBuffer || pdfBuffer.length === 0) {
            return res.status(500).json({ message: "No se pudo generar el PDF (está vacío)" });
        }

        // Opción 1: Devolver como JSON con base64
        if (req.query.format === 'json') {
            const pdfBase64 = pdfBuffer.toString('base64');
            return res.json({
                success: true,
                pdf: `data:application/pdf;base64,${pdfBase64}`,
                filename: `pasaje-${reservation._id}.pdf`
            });
        }

        // Opción 2: Descarga directa
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Length', pdfBuffer.length);
        res.setHeader('Content-Disposition', `inline; filename="pasaje-${reservation._id}.pdf"`);

        return res.send(pdfBuffer);

    } catch (error) {
        console.error('Error generando PDF:', error);

        if (error.name === 'CastError') {
            return res.status(400).json({ message: "ID de reserva inválido" });
        }

        return res.status(500).json({
            message: "Error interno generando PDF",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
import PDFDocument from 'pdfkit';
import Reservation from '../models/Reservation.js';
import User from '../models/User.js';

/**
 * Genera un PDF moderno con el ticket de la reserva y lo envía en la respuesta.
 * Se basa en el diseño del template HTML proporcionado.
 * No muestra campos vacíos o nulos.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const generateTicketPdf = async (req, res) => {
    try {
        const { reservationId } = req.params;

        // Buscar reserva, poblar servicio y usuario
        const reservation = await Reservation.findById(reservationId)
            .populate('service')
            .populate('user');
        if (!reservation) {
            return res.status(404).json({ message: 'Reserva no encontrada' });
        }

        const service = reservation.service;
        if (!service) {
            return res.status(404).json({ message: 'Servicio asociado no encontrado' });
        }

        const user = reservation.user;

        // Crear documento PDF en memoria con tamaño A4 y márgenes
        const doc = new PDFDocument({ size: 'A4', margin: 40 });

        // Configurar headers para respuesta PDF inline
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=ticket_${reservationId}.pdf`);

        // Pipe PDF al response
        doc.pipe(res);

        // --- Estilos y helpers ---
        const primaryColor = '#013ba7';
        const accentColor = '#f7c938';
        const textColor = '#464647';
        const fontNormal = 'Helvetica';
        const fontBold = 'Helvetica-Bold';

        // --- Contenido del PDF ---

        // Título principal
        doc.fillColor(primaryColor).font(fontBold).fontSize(26).text('¡Todo listo!', { align: 'center' });
        doc.moveDown(0.2);
        doc.strokeColor(accentColor).lineWidth(3);
        const lineWidth = 60;
        const centerX = doc.page.width / 2;
        doc.moveTo(centerX - lineWidth / 2, doc.y).lineTo(centerX + lineWidth / 2, doc.y).stroke();
        doc.moveDown(0.3);
        doc.font(fontNormal).fontSize(18).fillColor(textColor).text('Tu pasaje fue confirmado con éxito.', { align: 'center' });
        doc.moveDown(1);

        // Detalle de la compra - caja blanca con borde redondeado
        const boxX = 40;
        const boxWidth = doc.page.width - 80;
        // Ajustamos altura para que quepa todo (pasajero incluido)
        const boxHeight = 280;
        const boxPadding = 15;
        const boxY = doc.y;

        // Dibujar fondo blanco con borde gris claro
        doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 10).fillAndStroke('#ffffff', '#cccccc');
        doc.fillColor(textColor);

        // Dentro caja: título y número de reserva destacado
        doc.font(fontBold).fontSize(18).fillColor(primaryColor).text('Detalle de tu compra', boxX + boxPadding, boxY + boxPadding, { width: boxWidth - boxPadding * 2, align: 'center' });

        // Número de reserva destacado en un "pill"
        const reservationNumber = reservation._id.toString();
        const pillText = `N° de Reserva: ${reservationNumber}`;
        const pillWidth = doc.widthOfString(pillText) + 30;
        const pillHeight = 30;
        const pillX = boxX + (boxWidth - pillWidth) / 2;
        const pillY = boxY + boxPadding + 30;

        doc.roundedRect(pillX, pillY, pillWidth, pillHeight, 15).fill(primaryColor);
        doc.fillColor('#ffffff').font(fontNormal).fontSize(14).text(pillText, pillX, pillY + 7, { width: pillWidth, align: 'center' });

        // Mover cursor debajo del pill
        doc.y = pillY + pillHeight + 15;

        // Datos del viaje en tabla 2 columnas, filas dinámicas
        const col1X = boxX + boxPadding;
        const col2X = boxX + boxWidth / 2 + boxPadding / 2;
        const rowHeight = 30;
        let currentY = doc.y;

        // Helper para dibujar label + value (sin iconos para evitar problemas)
        const drawCell = (x, y, label, value) => {
            if (!value) return false;
            doc.fillColor(primaryColor).font(fontBold).fontSize(11).text(label.toUpperCase(), x, y);
            doc.fillColor(textColor).font(fontNormal).fontSize(11).text(value, x, y + 14);
            return true;
        };

        // Lista de campos a mostrar en orden
        // Se colocan en pares para las dos columnas
        const fields = [
            ['Origen', service.origin],
            ['Destino', service.destination],
            ['Empresa', service.busCompany || 'N/A'],
            ['Fecha de viaje', service.date ? new Date(service.date).toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' }) : null],
            ['Horario Salida', service.time],
            ['Pasajero', user?.name],
            ['Email', user?.email],
            ['Asiento', reservation.seatNumber],
            ['Estado', reservation.status ? reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1) : null],
        ];

        // Dibujar filas, dos columnas por fila
        for (let i = 0; i < fields.length; i += 2) {
            const leftField = fields[i];
            const rightField = fields[i + 1];

            const leftDrawn = drawCell(col1X, currentY, leftField[0], leftField[1]);
            const rightDrawn = rightField ? drawCell(col2X, currentY, rightField[0], rightField[1]) : false;

            // Solo avanzar si al menos una columna se dibujó
            if (leftDrawn || rightDrawn) {
                currentY += rowHeight;
            }
        }

        // Actualizar doc.y para que continúe después del cuadro
        doc.y = boxY + boxHeight + 20;

        // Recordatorios
        doc.fillColor(primaryColor).font(fontBold).fontSize(16).text('Por favor recuerda', { align: 'center' });
        doc.moveDown(0.5);

        const reminders = [
            'Tu pasaje es válido solo para la fecha y hora señalada.',
            'Presenta tu boleto en el formato indicado: impreso o digital.',
            'No podrás hacer cambios en la fecha ni datos de tu pasaje.',
            'Podrás anular tu pasaje hasta cuatro 4 horas antes de la hora de salida.',
        ];

        reminders.forEach((text) => {
            doc.fillColor(textColor).font(fontNormal).fontSize(11).text(`• ${text}`, { align: 'justify', indent: 20, paragraphGap: 4 });
        });

        doc.moveDown(1);

        // Contacto
        doc.fillColor(primaryColor).font(fontBold).fontSize(16).text('En caso de dudas o consultas, contáctanos:', { align: 'center' });
        doc.moveDown(0.5);

        doc.fillColor(textColor).font(fontNormal).fontSize(12).text('+56 2 3304 8632', { align: 'center' });
        doc.fillColor(textColor).font(fontNormal).fontSize(12).text('clientes@pullmanbus.cl', { align: 'center', link: 'mailto:clientes@pullmanbus.cl', underline: true });

        doc.moveDown(2);

        // Footer
        doc.font(fontNormal).fontSize(10).fillColor(textColor).text('pullmanbus.cl® Todos los derechos reservados.', { align: 'center' });
        doc.moveDown(0.2);
        doc.font(fontNormal).fontSize(10).fillColor(primaryColor).text('Si no quieres recibir más comunicaciones nuestras, haz clic en: Unsubscribe', {
            align: 'center',
            link: `${process.env.UNSUBSCRIBE_URL || 'https://pullmanbus.cl/unsubscribe'}`,
            underline: true,
        });

        // Finalizar PDF
        doc.end();
    } catch (error) {
        console.error('Error generando PDF:', error);
        res.status(500).json({ message: 'Error interno al generar el ticket' });
    }
};
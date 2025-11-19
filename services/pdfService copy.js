import PDFDocument from 'pdfkit';

export const generateReservationPDF = (reservationPopulated) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const chunks = [];

            // Capturar el PDF en memoria
            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => {
                const pdfBuffer = Buffer.concat(chunks);
                const base64PDF = pdfBuffer.toString('base64');
                resolve(base64PDF);
            });

            // Contenido del PDF
            doc.fontSize(20).font('Helvetica-Bold').text('TÁNDEM INDUSTRIAL', { align: 'center' });
            doc.moveDown(0.5);

            doc.fontSize(16).font('Helvetica').text('PASAJE DE BUS', { align: 'center' });
            doc.moveDown(1);

            // Línea separadora
            doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
            doc.moveDown(1);

            // Información del pasaje
            doc.fontSize(12).font('Helvetica-Bold');
            doc.text(`Nº de Confirmación: ${reservationPopulated._id}`);
            doc.moveDown(0.5);

            doc.text(`Pasajero: ${reservationPopulated.user?.name || 'No especificado'}`);
            doc.moveDown(0.5);

            doc.text(`RUT: ${reservationPopulated.user?.rut || 'No especificado'}`);
            doc.moveDown(0.5);

            doc.text(`Email: ${reservationPopulated.user?.email || 'No especificado'}`);
            doc.moveDown(1);

            // Información del viaje
            const service = reservationPopulated.service || {};
            const origin = service.origin || reservationPopulated.origin || "No especificado";
            const destination = service.destination || reservationPopulated.destination || "No especificado";
            const date = service.date || reservationPopulated.date;

            let travelDate = "No especificado";
            let departureTime = "No especificado";

            if (date) {
                const dateObj = new Date(date);
                if (!isNaN(dateObj.getTime())) {
                    travelDate = dateObj.toLocaleDateString('es-CL');
                    departureTime = dateObj.toLocaleTimeString('es-CL', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                    });
                }
            }

            doc.text(`Origen: ${origin}`);
            doc.moveDown(0.5);

            doc.text(`Destino: ${destination}`);
            doc.moveDown(0.5);

            doc.text(`Fecha de viaje: ${travelDate}`);
            doc.moveDown(0.5);

            doc.text(`Hora de salida: ${departureTime}`);
            doc.moveDown(0.5);

            doc.text(`Asiento: ${reservationPopulated.seatNumber}`);
            doc.moveDown(1);

            // Código de autorización
            doc.fontSize(14).text(`Código de Autorización: ${reservationPopulated.authorizationCode || 'N/A'}`, { align: 'center' });
            doc.moveDown(1);

            // Línea separadora
            doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
            doc.moveDown(1);

            // Instrucciones
            doc.fontSize(10).font('Helvetica');
            doc.text('INSTRUCCIONES:', { underline: true });
            doc.moveDown(0.3);
            doc.text('• Presente este pasaje impreso o en formato digital al conductor.');
            doc.moveDown(0.3);
            doc.text('• Llegue al menos 30 minutos antes de la hora de salida.');
            doc.moveDown(0.3);
            doc.text('• El pasaje es válido solo para la fecha y hora indicadas.');
            doc.moveDown(0.3);
            doc.text('• No se permiten cambios de fecha ni datos del pasaje.');
            doc.moveDown(0.3);
            doc.text('• Puede anular su pasaje hasta 4 horas antes de la salida.');
            doc.moveDown(1);

            // Pie de página
            doc.fontSize(8).text('Tándem Industrial • Tel: +56 2 3304 5632 • Email: clientes@pullmanbus.cl', { align: 'center' });
            doc.text('www.tandemindustrial.cl', { align: 'center' });

            doc.end();

        } catch (error) {
            reject(error);
        }
    });
};
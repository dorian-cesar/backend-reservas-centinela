import PDFDocument from 'pdfkit';

export const generateReservationPDF = (reservationPopulated) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                margin: 30,
                size: 'A4'
            });
            const chunks = [];

            // Capturar el PDF en memoria
            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => {
                const pdfBuffer = Buffer.concat(chunks);
                const base64PDF = pdfBuffer.toString('base64');
                resolve(base64PDF);
            });

            // Colores
            const colors = {
                primary: '#1e3a8a',
                primaryDark: '#1e40af',
                text: '#333333',
                textLight: '#666666',
                background: '#f5f5f5',
                white: '#ffffff'
            };

            // Fondo gris claro
            doc.rect(0, 0, doc.page.width, doc.page.height)
                .fill(colors.background);

            // Contenedor principal
            const containerWidth = 540;
            const containerX = (doc.page.width - containerWidth) / 2;

            // Header
            doc.rect(containerX, 40, containerWidth, 80)
                .fill(colors.white);

            doc.fontSize(28).fillColor(colors.primary)
                .font('Helvetica-Bold')
                .text('Tándem', containerX + 20, 60, {
                    width: containerWidth - 40,
                    align: 'center'
                });

            // Mensaje de éxito
            const userName = reservationPopulated.user?.name || 'Pasajero';
            doc.fontSize(20).fillColor(colors.text)
                .font('Helvetica-Bold')
                .text(`¡Todo listo, ${userName}!`, containerX + 20, 120, {
                    width: containerWidth - 40,
                    align: 'center'
                });

            doc.fontSize(14).fillColor(colors.textLight)
                .font('Helvetica')
                .text('Tu pasaje fue confirmado con éxito.', containerX + 20, 145, {
                    width: containerWidth - 40,
                    align: 'center'
                });

            // Tarjeta del ticket
            const ticketY = 180;
            const ticketHeight = 280;

            // Sombra (simulada con gradiente)
            doc.rect(containerX - 2, ticketY - 2, containerWidth + 4, ticketHeight + 4)
                .fill('#e0e0e0');

            // Tarjeta principal
            doc.rect(containerX, ticketY, containerWidth, ticketHeight)
                .fill(colors.white)
                .stroke(colors.white);

            // Encabezado del ticket
            doc.fontSize(14).fillColor(colors.text)
                .font('Helvetica-Bold')
                .text('Detalle de tu compra', containerX + 20, ticketY + 30, {
                    width: containerWidth - 40,
                    align: 'center'
                });

            // Badge de confirmación
            const badgeY = ticketY + 55;
            const badgeWidth = containerWidth - 200;
            const badgeHeight = 30;
            const borderRadius = 15; // La mitad de la altura para obtener bordes completamente redondeados

            // Dibujar rectángulo redondeado
            doc.roundedRect(containerX + 100, badgeY, badgeWidth, badgeHeight, borderRadius)
                .fill(colors.primaryDark)
                .stroke(colors.primaryDark);

            doc.fontSize(13).fillColor(colors.white)
                .font('Helvetica-Bold')
                .text(`Nº DE CONFIRMACIÓN: ${reservationPopulated._id}`, containerX + 20, badgeY + 8, {
                    width: containerWidth - 40,
                    align: 'center'
                });

            // Detalles en dos columnas
            const detailsY = badgeY + 50;
            const colWidth = (containerWidth - 60) / 2;

            // Información del servicio
            const service = reservationPopulated.service || {};
            const template = service.template || {};

            const origin = service.origin || reservationPopulated.origin || "No especificado";
            const destination = service.destination || reservationPopulated.destination || "No especificado";


            const travelDate = service.date
                ? new Date(service.date).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })
                : "No especificado";

            const departureTime = template.time || "No especificado";

            // Primera fila - Origen y Destino
            doc.fontSize(11).fillColor(colors.textLight)
                .font('Helvetica-Bold')
                .text('ORIGEN', containerX + 20, detailsY, {
                    width: colWidth
                });

            doc.fontSize(14).fillColor(colors.text)
                .font('Helvetica-Bold')
                .text(origin, containerX + 20, detailsY + 15, {
                    width: colWidth
                });

            doc.fontSize(11).fillColor(colors.textLight)
                .font('Helvetica-Bold')
                .text('DESTINO', containerX + 30 + colWidth, detailsY, {
                    width: colWidth
                });

            doc.fontSize(14).fillColor(colors.text)
                .font('Helvetica-Bold')
                .text(destination, containerX + 30 + colWidth, detailsY + 15, {
                    width: colWidth
                });

            // Segunda fila - Nº de reserva y Empresa
            const secondRowY = detailsY + 50;

            doc.fontSize(11).fillColor(colors.textLight)
                .font('Helvetica-Bold')
                .text('Nº DE RESERVA', containerX + 20, secondRowY, {
                    width: colWidth
                });

            doc.fontSize(14).fillColor(colors.text)
                .font('Helvetica-Bold')
                .text(reservationPopulated._id, containerX + 20, secondRowY + 15, {
                    width: colWidth
                });

            doc.fontSize(11).fillColor(colors.textLight)
                .font('Helvetica-Bold')
                .text('EMPRESA', containerX + 30 + colWidth, secondRowY, {
                    width: colWidth
                });

            doc.fontSize(14).fillColor(colors.text)
                .font('Helvetica-Bold')
                .text('Tandem Industrial', containerX + 30 + colWidth, secondRowY + 15, {
                    width: colWidth
                });

            // Tercera fila - Fecha de viaje y Horario
            const thirdRowY = secondRowY + 50;

            doc.fontSize(11).fillColor(colors.textLight)
                .font('Helvetica-Bold')
                .text('FECHA DE VIAJE', containerX + 20, thirdRowY, {
                    width: colWidth
                });

            doc.fontSize(14).fillColor(colors.text)
                .font('Helvetica-Bold')
                .text(travelDate, containerX + 20, thirdRowY + 15, {
                    width: colWidth
                });

            doc.fontSize(11).fillColor(colors.textLight)
                .font('Helvetica-Bold')
                .text('HORARIO SALIDA', containerX + 30 + colWidth, thirdRowY, {
                    width: colWidth
                });


            doc.fontSize(14).fillColor(colors.text)
                .font('Helvetica-Bold')
                .text(departureTime, containerX + 30 + colWidth, thirdRowY + 15, {
                    width: colWidth
                });

            // Información adicional del pasajero
            const passengerY = ticketY + ticketHeight + 30;

            doc.rect(containerX, passengerY, containerWidth, 120)
                .fill(colors.white)
                .stroke(colors.white);

            // Título de información del pasajero
            doc.fontSize(14).fillColor(colors.text)
                .font('Helvetica-Bold')
                .text('Información del Pasajero', containerX + 20, passengerY + 20, {
                    width: containerWidth - 40
                });

            // Datos del pasajero
            const passengerInfoY = passengerY + 45;

            doc.fontSize(11).fillColor(colors.textLight)
                .font('Helvetica-Bold')
                .text('PASAJERO:', containerX + 20, passengerInfoY);

            doc.fontSize(12).fillColor(colors.text)
                .font('Helvetica')
                .text(reservationPopulated.user?.name || 'No especificado', containerX + 100, passengerInfoY);

            doc.fontSize(11).fillColor(colors.textLight)
                .font('Helvetica-Bold')
                .text('RUT:', containerX + 20, passengerInfoY + 20);

            doc.fontSize(12).fillColor(colors.text)
                .font('Helvetica')
                .text(reservationPopulated.user?.rut || 'No especificado', containerX + 100, passengerInfoY + 20);

            doc.fontSize(11).fillColor(colors.textLight)
                .font('Helvetica-Bold')
                .text('EMAIL:', containerX + 20, passengerInfoY + 40);

            doc.fontSize(12).fillColor(colors.text)
                .font('Helvetica')
                .text(reservationPopulated.user?.email || 'No especificado', containerX + 100, passengerInfoY + 40);

            doc.fontSize(11).fillColor(colors.textLight)
                .font('Helvetica-Bold')
                .text('ASIENTO:', containerX + 20, passengerInfoY + 60);

            doc.fontSize(12).fillColor(colors.text)
                .font('Helvetica')
                .text(reservationPopulated.seatNumber?.toString() || 'No especificado', containerX + 100, passengerInfoY + 60);

            // Código de autorización
            const authY = passengerY + 140;
            const authHeight = 40;
            const authBorderRadius = authHeight / 2; // 20px para bordes completamente redondeados

            // Dibujar rectángulo redondeado
            doc.roundedRect(containerX, authY, containerWidth, authHeight, authBorderRadius)
                .fill(colors.primary)
                .stroke(colors.primary);

            doc.fontSize(14).fillColor(colors.white)
                .font('Helvetica-Bold')
                .text(`Código de Autorización: ${reservationPopulated.authorizationCode || 'N/A'}`, containerX + 20, authY + 12, {
                    width: containerWidth - 40,
                    align: 'center'
                });

            // Información de contacto
            const footerY = authY + 60;

            doc.fontSize(14).fillColor(colors.text)
                .font('Helvetica-Bold')
                .text('En caso de dudas o consultas', containerX + 20, footerY, {
                    width: containerWidth - 40,
                    align: 'center'
                });

            doc.fontSize(13).fillColor(colors.text)
                .font('Helvetica')
                .text('Tel: +56 2 3304 5632 • Email: viajes@tandemindustrial.cl', containerX + 20, footerY + 25, {
                    width: containerWidth - 40,
                    align: 'center'
                });

            // Footer final
            doc.fontSize(11).fillColor(colors.textLight)
                .font('Helvetica')
                .text('tandemindustrial.cl · Todos los derechos reservados.', containerX + 20, footerY + 50, {
                    width: containerWidth - 40,
                    align: 'center'
                });

            doc.end();

        } catch (error) {
            reject(error);
        }
    });
};
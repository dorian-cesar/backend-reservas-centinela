import puppeteer from 'puppeteer';

const formatDateOnly = (d) => {
    if (!d) return 'No especificado';
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return 'No especificado';
    return dt.toISOString().split('T')[0]; // "YYYY-MM-DD"
};

const normalizeTimeString = (raw) => {
    if (!raw) return null;
    // Si ya viene "HH:MM" o "H:MM"
    const m1 = raw.toString().trim().match(/^(\d{1,2}):(\d{2})$/);
    if (m1) {
        return `${m1[1].padStart(2, '0')}:${m1[2]}`;
    }

    // Si viene Date ISO string, extraer hora (en UTC) y devolver HH:MM
    const m2 = raw.toString().trim().match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})/);
    if (m2) {
        return `${m2[2]}:${m2[3]}`;
    }

    // fallback null
    return null;
};

export const generateReservationPDF = async (reservationPopulated) => {
    const userName = reservationPopulated.user?.name || 'No especificado';
    const origin = reservationPopulated.service?.origin || reservationPopulated.origin || 'No especificado';
    const destination = reservationPopulated.service?.destination || reservationPopulated.destination || 'No especificado';

    // Fecha como YYYY-MM-DD (cortada)
    const travelDate = reservationPopulated.service?.date
        ? formatDateOnly(reservationPopulated.service.date)
        : (reservationPopulated.date ? formatDateOnly(reservationPopulated.date) : 'No especificado');

    // Hora: primero template.time (si existe), si no, intentar extraer de service.date
    const rawTemplateTime = reservationPopulated.service?.template?.time || reservationPopulated.service?.time || reservationPopulated.time;
    let departureTime = normalizeTimeString(rawTemplateTime);

    if (!departureTime && reservationPopulated.service?.date) {
        // Extraer HH:MM desde el ISO de service.date (no convertimos zona, solo tomamos la parte hora)
        departureTime = normalizeTimeString(new Date(reservationPopulated.service.date).toISOString());
    }
    departureTime = departureTime || 'No especificado';

    const reservationId = reservationPopulated._id;
    const seatNumber = reservationPopulated.seatNumber || 'N/A';
    const authorizationCode = reservationPopulated.authorizationCode || 'N/A';

    const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirmación de Pasaje - Tándem</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
                margin: 0; 
                padding: 20px; 
                background: #f5f5f5; 
                font-family: Arial, Helvetica, sans-serif; 
                color: #333; 
                min-height: 100vh;
            }
            .container { 
                width: 100%;
                max-width: 600px; 
                margin: 0 auto; 
                background: #f5f5f5; 
            }
            .card { 
                background: #fff; 
                border-radius: 10px; 
                padding: 26px; 
                box-shadow: 0 2px 6px rgba(0,0,0,0.08);
                margin-bottom: 20px;
            }
            .header { 
                text-align: center; 
                margin-bottom: 20px; 
            }
            .company-name { 
                font-size: 28px; 
                font-weight: 700; 
                color: #1e3a8a; 
                margin-bottom: 10px;
            }
            .title { 
                font-size: 20px; 
                margin: 0 0 6px; 
                font-weight: 600; 
                color: #333; 
            }
            .subtitle { 
                margin: 0; 
                font-size: 14px; 
                color: #666; 
            }
            .badge { 
                display: inline-block; 
                background: #1e40af; 
                color: #fff; 
                padding: 10px 18px; 
                border-radius: 30px; 
                font-weight: 700; 
                font-size: 13px; 
                margin: 10px 0;
            }
            .info-section {
                margin: 20px 0;
            }
            .info-grid {
                width: 100%;
                border-collapse: collapse;
            }
            .info-grid td {
                padding: 8px 0;
                vertical-align: top;
            }
            .info-label {
                color: #666;
                font-size: 11px;
                font-weight: 700;
                text-transform: uppercase;
                padding-bottom: 4px;
            }
            .info-value {
                font-size: 14px;
                color: #333;
                font-weight: 600;
            }
            .footer {
                font-size: 10px;
                text-align: center;
                margin-top: 30px;
                color: #666;
                padding-top: 20px;
                border-top: 1px solid #eee;
            }
            @media print {
                body { 
                    background: white !important;
                    padding: 0;
                }
                .container { 
                    box-shadow: none; 
                    margin: 0;
                }
                .card {
                    box-shadow: none;
                    border: 1px solid #ddd;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="company-name">Tándem</div>
                <h1 class="title">¡Todo listo, ${userName}!</h1>
                <p class="subtitle">Tu pasaje fue confirmado con éxito.</p>
            </div>

            <div class="card">
                <div class="info-section">
                    <div style="text-align: center;">
                        <div style="font-size: 14px; color: #333; font-weight: 600; margin-bottom: 10px;">
                            Detalle de tu compra
                        </div>
                        <div class="badge">Nº DE CONFIRMACIÓN: ${reservationId}</div>
                    </div>
                </div>

                <div class="info-section">
                    <table class="info-grid">
                        <tr>
                            <td style="width: 50%;">
                                <div class="info-label">Origen</div>
                                <div class="info-value">${origin}</div>
                            </td>
                            <td style="width: 50%;">
                                <div class="info-label">Destino</div>
                                <div class="info-value">${destination}</div>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <div class="info-label">Nº de reserva</div>
                                <div class="info-value">${reservationId}</div>
                            </td>
                            <td>
                                <div class="info-label">Empresa</div>
                                <div class="info-value">Tandem Industrial</div>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <div class="info-label">Fecha de viaje</div>
                                <div class="info-value">${travelDate}</div>
                            </td>
                            <td>
                                <div class="info-label">Horario salida</div>
                                <div class="info-value">${departureTime}</div>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <div class="info-label">Asiento</div>
                                <div class="info-value">${seatNumber}</div>
                            </td>
                            <td>
                                <div class="info-label">Código autorización</div>
                                <div class="info-value">${authorizationCode}</div>
                            </td>
                        </tr>
                    </table>
                </div>

                <div class="footer">
                    Tándem Industrial • Tel: +56 2 3304 5632 • Email: clientes@pullmanbus.cl<br>
                    tandemindustrial.cl · Todos los derechos reservados.
                </div>
            </div>
        </div>
    </body>
    </html>
    `;

    let browser;
    try {
        // Configuración más robusta de Puppeteer
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ]
        });

        const page = await browser.newPage();

        // Configurar viewport
        await page.setViewport({ width: 1200, height: 800 });

        // Establecer contenido con timeout más largo
        await page.setContent(html, {
            waitUntil: ['networkidle0', 'domcontentloaded'],
            timeout: 30000
        });

        // Esperar a que los elementos críticos estén renderizados
        await page.waitForSelector('.container', { timeout: 10000 });

        // Generar PDF con configuración mejorada
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20mm',
                right: '15mm',
                bottom: '20mm',
                left: '15mm'
            },
            displayHeaderFooter: false,
            preferCSSPageSize: true
        });

        // Verificar que el PDF tenga contenido
        if (!pdfBuffer || pdfBuffer.length < 100) {
            throw new Error('PDF generado está vacío o es muy pequeño');
        }

        return pdfBuffer;

    } catch (error) {
        console.error('Error en generateReservationPDF:', error);
        throw error;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
};
import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";
dotenv.config();

// CONFIGURACIÓN DE SENDGRID - Esto debe estar ANTES de cualquier uso de sgMail
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const sendReservationEmailNotification = async (reservationPopulated) => {
  if (!reservationPopulated) throw new Error("Reservation is required");

  // Validar que el usuario esté poblado y tenga los datos necesarios
  if (!reservationPopulated.user) {
    throw new Error("User data missing on reservation");
  }

  const to = reservationPopulated.user.email;
  if (!to) throw new Error("User email missing on reservation");

  const userName = reservationPopulated.user.name || "Cliente";
  const service = reservationPopulated.service || {};

  // Obtener los datos del servicio o de la reserva
  const origin = service.origin || reservationPopulated.origin || "No especificado";
  const destination = service.destination || reservationPopulated.destination || "No especificado";

  const date = service.date || reservationPopulated.date || "No especificado";
  const time = service.time || reservationPopulated.time || "No especificado";

  if (date instanceof Date || (typeof date === 'string' && date !== "No especificado")) {
    const dateObj = new Date(date);
    if (!isNaN(dateObj.getTime())) {
      travelDate = dateObj.toLocaleDateString('es-CL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
  }

  const downloadUrl = `https://reserva-centinela.dev-wit.com/api/pdf/reservation/${reservationPopulated._id}/pdf`;

  const html = `
    <!doctype html>
<html lang="es">

<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width" />
  <title>Confirmación de Pasaje - Tándem</title>
  <style>
    /* media queries son soportadas por la mayoría de clientes móviles */
    @media only screen and (max-width:600px) {
      .container {
        width: 100% !important;
        padding: 12px !important;
      }

      .stack-column {
        display: block !important;
        width: 100% !important;
      }

      .ticket-padding {
        padding: 18px !important;
      }

      .badge {
        display: inline-block !important;
        padding: 10px 16px !important;
      }

      .two-col td {
        display: block !important;
        width: 100% !important;
      }
    }
  </style>
</head>

<body style="margin:0; padding:0; background-color:#f5f5f5; font-family: Arial, Helvetica, sans-serif; color:#333;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr>
      <td align="center" style="padding:24px;">
        <!-- Container -->
        <table class="container" width="600" cellpadding="0" cellspacing="0" role="presentation"
          style="width:600px; max-width:600px; background-color:#f5f5f5;">
          <tr>
            <td style="padding:20px;">

              <!-- Header -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="center" style="padding:24px 0;">
                    <div style="font-size:28px; font-weight:700; color:#1e3a8a;">Tándem</div>
                  </td>
                </tr>
              </table>

              <!-- Success message -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="center" style="padding:8px 0 18px;">
                    <h1 style="font-size:20px; margin:0 0 6px; font-weight:600; color:#333;">¡Todo listo, ${userName}!</h1>
                    <p style="margin:0; font-size:14px; color:#666;">Tu pasaje fue confirmado con éxito.</p>
                  </td>
                </tr>
              </table>

              <!-- Ticket card -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                style="background:#ffffff; border-radius:10px; box-shadow:0 2px 6px rgba(0,0,0,0.08); overflow:hidden;">
                <tr>
                  <td class="ticket-padding" style="padding:26px;">
                    <!-- Ticket header -->
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="text-align:center; padding-bottom:14px;">
                          <div style="font-size:14px; font-weight:600; color:#333;">Detalle de tu compra</div>
                        </td>
                      </tr>
                      <tr>
                        <td style="text-align:center;">
                          <span class="badge"
                            style="display:inline-block; background:#1e40af; color:#fff; padding:10px 18px; border-radius:30px; font-weight:700; font-size:13px;">
                            Nº DE CONFIRMACIÓN: ${reservationPopulated._id}
                          </span>
                        </td>
                      </tr>
                    </table>

                    <!-- Spacer -->
                    <div style="height:18px; line-height:18px; font-size:1px;">&nbsp;</div>

                    <!-- Details (two columns) -->
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" class="two-col"
                      style="width:100%;">
                      <tr>
                        <td valign="top" style="padding:6px 8px; width:50%;">
                          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                            <tr>
                              <td
                                style="font-size:11px; color:#666; font-weight:700; text-transform:uppercase; padding-bottom:6px;">
                                Origen</td>
                            </tr>
                            <tr>
                              <td style="font-size:14px; color:#333; font-weight:600;">${origin}</td>
                            </tr>
                          </table>
                        </td>
                        <td valign="top" style="padding:6px 8px; width:50%;">
                          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                            <tr>
                              <td
                                style="font-size:11px; color:#666; font-weight:700; text-transform:uppercase; padding-bottom:6px;">
                                Destino</td>
                            </tr>
                            <tr>
                              <td style="font-size:14px; color:#333; font-weight:600;">${destination}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <tr>
                        <td valign="top" style="padding:16px 8px 6px; width:50%;">
                          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                            <tr>
                              <td
                                style="font-size:11px; color:#666; font-weight:700; text-transform:uppercase; padding-bottom:6px;">
                                Nº de reserva</td>
                            </tr>
                            <tr>
                              <td style="font-size:14px; color:#333; font-weight:600;">${reservationPopulated._id}</td>
                            </tr>
                          </table>
                        </td>
                        <td valign="top" style="padding:16px 8px 6px; width:50%;">
                          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                            <tr>
                              <td
                                style="font-size:11px; color:#666; font-weight:700; text-transform:uppercase; padding-bottom:6px;">
                                Empresa</td>
                            </tr>
                            <tr>
                              <td style="font-size:14px; color:#333; font-weight:600;">Tandem Industrial</td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <tr>
                        <td valign="top" style="padding:16px 8px 0; width:50%;">
                          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                            <tr>
                              <td
                                style="font-size:11px; color:#666; font-weight:700; text-transform:uppercase; padding-bottom:6px;">
                                Fecha de viaje</td>
                            </tr>
                            <tr>
                              <td style="font-size:14px; color:#333; font-weight:600;">${date}</td>
                            </tr>
                          </table>
                        </td>
                        <td valign="top" style="padding:16px 8px 0; width:50%;">
                          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                            <tr>
                              <td
                                style="font-size:11px; color:#666; font-weight:700; text-transform:uppercase; padding-bottom:6px;">
                                Horario salida</td>
                            </tr>
                            <tr>
                              <td style="font-size:14px; color:#333; font-weight:600;">${time}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- Download button -->
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top:22px;">
                    <tr>
                        <td align="center">
                        <a href="${downloadUrl}" target="_blank"
                            style="display:inline-block; text-decoration:none; padding:12px 22px; background:#1e40af; color:#ffffff; border-radius:26px; font-weight:700; font-size:14px;">
                            DESCARGAR PASAJE (PDF)
                        </a>
                        </td>
                    </tr>
                    </table>

                  </td>
                </tr>
              </table>



              <!-- Contact & footer -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top:16px;">
                <tr>
                  <td align="center" style="padding:18px 8px 8px;">
                    <div style="font-size:14px; font-weight:700; color:#333; margin-bottom:10px;">En caso de dudas o
                      consultas</div>
                    <div style="font-size:13px; color:#333; margin-bottom:8px;">Tel: +56 2 3304 5632 • Email:
                      clientes@pullmanbus.cl</div>
                  </td>
                </tr>

                <tr>
                  <td align="center" style="padding:14px 8px 28px;">
                    <div style="font-size:11px; color:#666; line-height:1.6; text-align:center;">
                      <strong>tandemindustrial.cl</strong> · Todos los derechos reservados.
                    </div>
                  </td>
                </tr>
              </table>

            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>

</html>
    `;

  const msg = {
    to: to,
    from: "viajes@pullmanbus.cl",
    subject: "Confirmación de pasaje - Tandem Industrial",
    html
  };

  return sgMail.send(msg);
};


export const sendSeatReleasedEmailNotification = async (reservationPopulated, serviceInfo) => {
  if (!reservationPopulated) throw new Error("Reservation is required");

  // Validar que el usuario esté poblado y tenga los datos necesarios
  if (!reservationPopulated.user) {
    throw new Error("User data missing on reservation");
  }

  const to = reservationPopulated.user.email;
  if (!to) throw new Error("User email missing on reservation");

  const userName = reservationPopulated.user.name || "Cliente";
  const service = reservationPopulated.service || serviceInfo || {};

  // Obtener los datos del servicio
  const origin = service.origin || "No especificado";
  const destination = service.destination || "No especificado";
  const date = service.date || "No especificado";

  let travelDate = "No especificado";
  let departureTime = "No especificado";

  if (date instanceof Date || (typeof date === 'string' && date !== "No especificado")) {
    const dateObj = new Date(date);
    if (!isNaN(dateObj.getTime())) {
      // Formatear fecha: DD/MM/YYYY
      travelDate = dateObj.toLocaleDateString('es-CL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });

      // Formatear hora: HH:MM
      departureTime = dateObj.toLocaleTimeString('es-CL', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    }
  }

  const html = `
  <!doctype html>
<html lang="es">

<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width" />
<title>Asiento Liberado - Tándem</title>
<style>
  @media only screen and (max-width:600px) {
    .container {
      width: 100% !important;
      padding: 12px !important;
    }
    .stack-column {
      display: block !important;
      width: 100% !important;
    }
    .ticket-padding {
      padding: 18px !important;
    }
    .badge {
      display: inline-block !important;
      padding: 10px 16px !important;
    }
    .two-col td {
      display: block !important;
      width: 100% !important;
    }
  }
</style>
</head>

<body style="margin:0; padding:0; background-color:#f5f5f5; font-family: Arial, Helvetica, sans-serif; color:#333;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation">
  <tr>
    <td align="center" style="padding:24px;">
      <!-- Container -->
      <table class="container" width="600" cellpadding="0" cellspacing="0" role="presentation"
        style="width:600px; max-width:600px; background-color:#f5f5f5;">
        <tr>
          <td style="padding:20px;">

            <!-- Header -->
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
              <tr>
                <td align="center" style="padding:24px 0;">
                  <div style="font-size:28px; font-weight:700; color:#1e3a8a;">Tándem</div>
                </td>
              </tr>
            </table>

            <!-- Release message -->
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
              <tr>
                <td align="center" style="padding:8px 0 18px;">
                  <h1 style="font-size:20px; margin:0 0 6px; font-weight:600; color:#333;">Asiento Liberado</h1>
                  <p style="margin:0; font-size:14px; color:#666;">Tu asiento ha sido liberado exitosamente.</p>
                </td>
              </tr>
            </table>

            <!-- Ticket card -->
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
              style="background:#ffffff; border-radius:10px; box-shadow:0 2px 6px rgba(0,0,0,0.08); overflow:hidden;">
              <tr>
                <td class="ticket-padding" style="padding:26px;">
                  <!-- Ticket header -->
                  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                    <tr>
                      <td style="text-align:center; padding-bottom:14px;">
                        <div style="font-size:14px; font-weight:600; color:#333;">Detalle de la liberación</div>
                      </td>
                    </tr>
                    <tr>
                      <td style="text-align:center;">
                        <span class="badge"
                          style="display:inline-block; background:#dc2626; color:#fff; padding:10px 18px; border-radius:30px; font-weight:700; font-size:13px;">
                          ASIENTO LIBERADO
                        </span>
                      </td>
                    </tr>
                  </table>

                  <!-- Spacer -->
                  <div style="height:18px; line-height:18px; font-size:1px;">&nbsp;</div>

                  <!-- Details (two columns) -->
                  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" class="two-col"
                    style="width:100%;">
                    <tr>
                      <td valign="top" style="padding:6px 8px; width:50%;">
                        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                          <tr>
                            <td
                              style="font-size:11px; color:#666; font-weight:700; text-transform:uppercase; padding-bottom:6px;">
                              Origen</td>
                          </tr>
                          <tr>
                            <td style="font-size:14px; color:#333; font-weight:600;">${origin}</td>
                          </tr>
                        </table>
                      </td>
                      <td valign="top" style="padding:6px 8px; width:50%;">
                        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                          <tr>
                            <td
                              style="font-size:11px; color:#666; font-weight:700; text-transform:uppercase; padding-bottom:6px;">
                              Destino</td>
                          </tr>
                          <tr>
                            <td style="font-size:14px; color:#333; font-weight:600;">${destination}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <tr>
                      <td valign="top" style="padding:16px 8px 6px; width:50%;">
                        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                          <tr>
                            <td
                              style="font-size:11px; color:#666; font-weight:700; text-transform:uppercase; padding-bottom:6px;">
                              Nº de reserva</td>
                          </tr>
                          <tr>
                            <td style="font-size:14px; color:#333; font-weight:600;">${reservationPopulated._id}</td>
                          </tr>
                        </table>
                      </td>
                      <td valign="top" style="padding:16px 8px 6px; width:50%;">
                        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                          <tr>
                            <td
                              style="font-size:11px; color:#666; font-weight:700; text-transform:uppercase; padding-bottom:6px;">
                              Asiento</td>
                          </tr>
                          <tr>
                            <td style="font-size:14px; color:#333; font-weight:600;">${reservationPopulated.seatNumber}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <tr>
                      <td valign="top" style="padding:16px 8px 0; width:50%;">
                        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                          <tr>
                            <td
                              style="font-size:11px; color:#666; font-weight:700; text-transform:uppercase; padding-bottom:6px;">
                              Fecha de viaje</td>
                          </tr>
                          <tr>
                            <td style="font-size:14px; color:#333; font-weight:600;">${travelDate}</td>
                          </tr>
                        </table>
                      </td>
                      <td valign="top" style="padding:16px 8px 0; width:50%;">
                        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                          <tr>
                            <td
                              style="font-size:11px; color:#666; font-weight:700; text-transform:uppercase; padding-bottom:6px;">
                              Horario salida</td>
                          </tr>
                          <tr>
                            <td style="font-size:14px; color:#333; font-weight:600;">${departureTime}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- Release info -->
                  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top:22px;">
                    <tr>
                      <td align="center" style="padding:16px; background:#fef2f2; border-radius:8px;">
                        <div style="font-size:13px; color:#dc2626; font-weight:600; margin-bottom:6px;">
                          ✅ Asiento liberado exitosamente
                        </div>
                        <div style="font-size:12px; color:#666;">
                          Fecha de liberación: ${new Date().toLocaleDateString('es-CL')}
                        </div>
                      </td>
                    </tr>
                  </table>

                </td>
              </tr>
            </table>

            <!-- Contact & footer -->
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top:16px;">
              <tr>
                <td align="center" style="padding:18px 8px 8px;">
                  <div style="font-size:14px; font-weight:700; color:#333; margin-bottom:10px;">En caso de dudas o
                    consultas</div>
                  <div style="font-size:13px; color:#333; margin-bottom:8px;">Tel: +56 2 3304 5632 • Email:
                    clientes@pullmanbus.cl</div>
                </td>
              </tr>

              <tr>
                <td align="center" style="padding:14px 8px 28px;">
                  <div style="font-size:11px; color:#666; line-height:1.6; text-align:center;">
                    <strong>tandemindustrial.cl</strong> · Todos los derechos reservados.
                  </div>
                </td>
              </tr>
            </table>

          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>

</html>
  `;

  const msg = {
    to: to,
    from: "viajes@pullmanbus.cl",
    subject: "Asiento liberado - Tandem Industrial",
    html
  };

  return sgMail.send(msg);
};
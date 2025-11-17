import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";
dotenv.config();
sgMail.setApiKey(process.env.SENDGRID_API_KEY);


export const sendReservationEmailNotification = async (reservationPopulated) => {
    if (!reservationPopulated) throw new Error("Reservation is required");
    const to = reservationPopulated.user?.email;
    if (!to) throw new Error("User email missing on reservation");

    const service = reservationPopulated.service || {};
    const templateData = {
        reservation_number: reservationPopulated._id.toString(),
        origin: service.origin || "",
        destination: service.destination || "",
        bus_company: service.template?.companyName || "Empresa de buses",
        travel_date: service.date ? new Date(service.date).toISOString() : "",
        departure_time: service.time || "",
        ticket_url: `https://reserva-centinela.dev-wit.com/api/ticket/${reservationPopulated._id}`,
    };

    const msg = {
        to,
        from: "viajes@pullmanbus.cl", // correo verificado en SendGrid
        templateId: process.env.SENDGRID_RESERVATION_TEMPLATE_ID || "d-7be85246160348a490780c74d686991a",
        dynamicTemplateData: templateData,
    };

    return sgMail.send(msg);
};

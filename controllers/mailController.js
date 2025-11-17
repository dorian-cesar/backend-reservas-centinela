import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";
dotenv.config();
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

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
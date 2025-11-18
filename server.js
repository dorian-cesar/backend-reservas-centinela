import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import startExtendServicesCron from "./crons/extendServicesCron.js";
import startSeatReleaseCron from "./crons/seatReleaseCron.js";
import setupSwagger from './swagger.js';
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import serviceRoutes from "./routes/serviceRoutes.js";
import reservationRoutes from "./routes/reservationRoutes.js";
import busLayoutRoutes from "./routes/busLayoutRoutes.js";
import cityRoutes from "./routes/cityRoutes.js";
import mailRoutes from "./routes/mailroutes.js"
import pdfRoutes from "./routes/pdfRoutes.js"


dotenv.config();

const app = express();
setupSwagger(app);
app.use(cors());
app.use(express.json());

// Rutas principales
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/layouts", busLayoutRoutes);
app.use("/api/cities", cityRoutes);
app.use("/api/mail", mailRoutes);
app.use("/api/pdf", pdfRoutes);


app.get('/api/test', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Backend funcionando',
        timestamp: new Date().toISOString()
    });
});

const PORT = process.env.PORT || 4000;

connectDB()
    .then(() => {

        if (process.env.NODE_ENV !== 'development') {
            startExtendServicesCron();
            startSeatReleaseCron();
        }
        app.listen(PORT, () => console.log(`🚍 Servidor corriendo en puerto ${PORT}`));
    })
    .catch((err) => {
        console.error("Error al iniciar el servidor:", err);
    });
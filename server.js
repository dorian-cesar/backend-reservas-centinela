import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import startExtendServicesCron from "./crons/extendServicesCron.js";
import startSeatReleaseCron from "./crons/seatReleaseCron.js";
import setupSwagger from './swagger.js';

import indexRoutes from './routes/indexRoutes.js'


dotenv.config();

const app = express();
setupSwagger(app);
app.use(cors());
app.use(express.json());

app.use('/api', indexRoutes);

app.get('/api/test', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Backend funcionando',
        timestamp: new Date().toISOString()
    });
});

app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});

const PORT = process.env.PORT || 4000;

connectDB()
    .then(() => {

        if (process.env.NODE_ENV !== 'development') {
            //startExtendServicesCron();
            startSeatReleaseCron();
        }

        app.listen(PORT, () => console.log(`🚍 Servidor corriendo en puerto ${PORT}`));
        console.log("[DEBUG] Variables de entorno cargadas:");
        console.log("EMAIL", process.env.SENDGRID_EMAIL);
    })
    .catch((err) => {
        console.error("Error al iniciar el servidor:", err);
    });
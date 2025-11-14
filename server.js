import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import startExtendServicesCron from "./crons/extendServicesCron.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import serviceRoutes from "./routes/serviceRoutes.js";
import reservationRoutes from "./routes/reservationRoutes.js";
import busLayoutRoutes from "./routes/busLayoutRoutes.js";
import cityRoutes from "./routes/cityRoutes.js";



dotenv.config();
connectDB();
startExtendServicesCron();

const app = express();
app.use(cors());
app.use(express.json());

// Rutas principales
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/layouts", busLayoutRoutes);
app.use("/api/cities", cityRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚍 Servidor corriendo en puerto ${PORT}`));
//comentario de prueba//

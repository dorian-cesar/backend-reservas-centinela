// scripts/seedFromCsv.js
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { parse } from "csv-parse";
import mongoose from "mongoose";
import Service from "../models/Service.js";

dotenv.config();

const __dirname = path.resolve();
const csvFilePath = path.join(__dirname, "Malla Centinela...xlsx - Servicios.csv");

// Conexión a MongoDB
await mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
console.log("✅ Conectado a MongoDB");

// Función para convertir texto de frecuencia en array de días
const parseFrequency = (text) => {
  if (!text) return [];
  return text
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter((d) => d.length > 0);
};

// Lectura del CSV
const services = [];

fs.createReadStream(csvFilePath)
  .pipe(parse({ columns: true, delimiter: ",", skip_empty_lines: true }))
  .on("data", (row) => {
    const service = {
      origin: row["Origen"] || "",
      destination: row["Destino"] || "",
      departureTime: row["Hora Salida"] || "",
      arrivalTime: row["Hora Llegada"] || "",
      busType: row["Tipo Bus"] || "",
      frequency: parseFrequency(row["Frecuencia"]), // Lunes, Martes, etc.
      startDate: row["Fecha Inicio"] || null,
      endDate: row["Fecha Fin"] || null,
      capacity: Number(row["Asientos"]) || 0,
      isSpecial: row["Especial"]?.toLowerCase() === "sí" || false,
    };
    services.push(service);
  })
  .on("end", async () => {
    try {
      console.log(`📦 Insertando ${services.length} servicios...`);
      await Service.insertMany(services);
      console.log("✅ Carga completada con éxito.");
      process.exit(0);
    } catch (err) {
      console.error("❌ Error al insertar servicios:", err);
      process.exit(1);
    }
  });

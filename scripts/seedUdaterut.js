// scripts/updateRutsFromCsv.js

import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { parse } from "csv-parse";
import mongoose from "mongoose";
// import bcrypt from "bcryptjs"; // Ya no necesario para la actualización simple
import User from "../models/User.js";

dotenv.config();

const __dirname = path.resolve();
// Asegúrate de que esta ruta sea correcta
const csvFilePath = path.join(
  __dirname,
  "nuevo personal centinela - Hoja 1.csv"
);

// --- CONEXIÓN A MONGODB ---
try {
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log("✅ Conectado a MongoDB, uri: " + process.env.MONGO_URI);
} catch (error) {
  console.error("❌ Error al conectar a MongoDB:", error.message);
  process.exit(1); // Salir si la conexión falla
}

// --- FUNCIÓN PARA ACTUALIZAR RUT ---
const updateRutByEmail = async (row) => {
  try {
    const rut = row["Rut"]?.trim();
    const email = row["Mail"]?.trim()?.toLowerCase();

    if (!email || !rut) {
      console.warn("⚠️ Fila ignorada (faltan email o rut):", row);
      return;
    }

    // Buscar al usuario por email
    const user = await User.findOne({ email });

    if (!user) {
      console.log(`⚠️ Usuario NO encontrado con email: ${email}`);
      return;
    }

    // Si el rut es el mismo, no actualizamos
    if (user.rut === rut) {
      console.log(`❕ Rut ya actualizado para ${email}: ${rut}`);
      return;
    }

    // Actualizar el campo rut
    await User.updateOne({ email }, { $set: { rut: rut } });

    console.log(
      `✅ Rut actualizado para ${email}: De '${user.rut}' a '${rut}'`
    );
  } catch (err) {
    console.error(
      `❌ Error actualizando rut para ${row["Mail"]}:`,
      err.message
    );
  }
};

// --- PROCESAR CSV ---
const processCsv = async () => {
  const rows = [];

  // 1️⃣ Leemos el CSV y acumulamos todas las filas
  try {
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvFilePath)
        .pipe(parse({ columns: true, delimiter: ",", skip_empty_lines: true }))
        .on("data", (row) => {
          const cleanedRow = {};
          // Limpiar espacios en blanco de los nombres de columna
          for (const key in row) {
            cleanedRow[key.trim()] = row[key];
          }
          rows.push(cleanedRow);
        })
        .on("end", resolve)
        .on("error", reject);
    });
  } catch (error) {
    console.error("❌ Error leyendo o parseando CSV:", error.message);
    await mongoose.disconnect();
    return;
  }

  console.log(`📦 ${rows.length} filas encontradas. Actualizando Ruts...`);

  // 2️⃣ Procesamos secuencialmente
  for (const row of rows) {
    await updateRutByEmail(row);
  }

  // 3️⃣ Cerramos la conexión
  await mongoose.disconnect();
  console.log("🎯 Actualización de Ruts completada y conexión cerrada.");
};

// --- EJECUTAR ---
processCsv().catch((err) => {
  console.error("❌ Error general en la ejecución:", err.message);
  mongoose.disconnect();
});

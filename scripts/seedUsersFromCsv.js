// scripts/seedUsersFromCsv.js
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { parse } from "csv-parse";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

dotenv.config();

const __dirname = path.resolve();
const csvFilePath = path.join(
  __dirname,
  "Dotación_131125.xlsx - INFORME_DOTACION_Montenegro Jor.csv"
);

await mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
console.log("✅ Conectado a MongoDB");

// Función para crear usuario
const createUser = async (row) => {
  try {
    const rut = row["RUT"]?.trim();
    const name = row["Nombre Completo"]?.trim();
    const email = row["Mail Laboral"]?.trim()?.toLowerCase();
    const plainPassword = row["password"]?.trim() || "123456";

    if (!email || !name) {
      console.warn("⚠️ Fila ignorada (faltan datos):", row);
      return;
    }

    const exists = await User.findOne({ email });
    if (exists) {
      console.log(`⚠️ Usuario ya existe: ${email}`);
      return;
    }

    const password = await bcrypt.hash(plainPassword, 10);

    const newUser = new User({
      name,
      email,
      password,
      rut,
      role: "user", // o "admin" si corresponde
    });

    await newUser.save();
    console.log(`✅ Usuario creado: ${name} (${email})`);
  } catch (err) {
    console.error("❌ Error creando usuario:", err.message);
  }
};

// Procesar CSV correctamente (sin cerrar antes de tiempo)
const processCsv = async () => {
  const rows = [];

  // 1️⃣ Leemos el CSV y acumulamos todas las filas
  await new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(parse({ columns: true, delimiter: ",", skip_empty_lines: true }))
      .on("data", (row) => {
        const cleanedRow = {};
        for (const key in row) {
          cleanedRow[key.trim()] = row[key];
        }
        rows.push(cleanedRow);
      })
      .on("end", resolve)
      .on("error", reject);
  });

  console.log(`📦 ${rows.length} filas encontradas. Creando usuarios...`);

  // 2️⃣ Procesamos secuencialmente (para evitar saturar Mongo)
  for (const row of rows) {
    await createUser(row);
  }

  // 3️⃣ Cerramos la conexión solo al final
  await mongoose.disconnect();
  console.log("🎯 Carga de usuarios completada y conexión cerrada.");
};

// Ejecutar
processCsv().catch((err) => {
  console.error("❌ Error general:", err.message);
  mongoose.disconnect();
});

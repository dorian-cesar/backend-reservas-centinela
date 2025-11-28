// scripts/updateRutsAndPasswordsFromCsv.js

import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { parse } from "csv-parse";
import mongoose from "mongoose";
import User from "../models/User.js"; // Importa tu modelo de usuario

dotenv.config();

const __dirname = path.resolve();
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
  process.exit(1);
}

// --- FUNCIÓN DE UTILIDAD ---
/**
 * Extrae los primeros 6 dígitos numéricos del RUT para usar como password.
 * @param {string} rut - El valor del RUT.
 * @returns {string} Los primeros 6 dígitos, o cadena vacía si no hay suficientes.
 */
const generatePasswordFromRut = (rut) => {
  // Eliminar puntos, guiones y cualquier carácter no numérico
  const numericRut = rut.replace(/[^0-9]/g, "");

  // Tomar los primeros 6 dígitos
  return numericRut.substring(0, 6);
};

// --- FUNCIÓN PARA ACTUALIZAR RUT Y PASSWORD ---
const updateRutAndPassword = async (row) => {
  try {
    const rutFromCsv = row["Rut"]?.trim();
    const email = row["Mail"]?.trim()?.toLowerCase();

    if (!email || !rutFromCsv) {
      console.warn("⚠️ Fila ignorada (faltan email o rut):", row);
      return;
    }

    // Generar la nueva contraseña basada en los primeros 6 dígitos del RUT
    const newPlainPassword = generatePasswordFromRut(rutFromCsv);

    if (newPlainPassword.length < 6) {
      console.warn(
        `⚠️ Rut inválido o demasiado corto para ${email}. Password no actualizada.`
      );
      return;
    }

    // Buscar al usuario por email
    const user = await User.findOne({ email });

    if (!user) {
      console.log(`⚠️ Usuario NO encontrado con email: ${email}`);
      return;
    }

    // Crear un objeto para las actualizaciones
    const updates = {};
    let rutUpdated = false;
    let passwordUpdated = false;

    // 1. Verificar y actualizar RUT
    if (user.rut !== rutFromCsv) {
      updates.rut = rutFromCsv;
      rutUpdated = true;
    }

    // 2. Verificar si la contraseña necesita ser actualizada/hasheada
    // IMPORTANTE: Dado que la contraseña en la DB está hasheada,
    // la única forma de verificar si la nueva contraseña plana es la misma
    // que la hasheada actual es comparando. Para simplificar y asegurar la actualización
    // si el rut ha cambiado, vamos a establecer la password si es necesario.

    // **Estrategia de Actualización de Contraseña:**
    // Para asegurarnos de que el `pre('save')` se active y la nueva contraseña (los 6 dígitos del rut)
    // se hashee, necesitamos usar `user.save()`.
    // Usar `updateOne` evita el middleware `pre('save')`.

    // Si el rut es nuevo, o si queremos forzar el reseteo de password:
    if (
      rutUpdated ||
      true /* Forzar reseteo de password al rut si es necesario */
    ) {
      // Establecer la nueva contraseña (plana) en la instancia del modelo
      user.password = newPlainPassword;
      passwordUpdated = true;
    }

    // Si no hay actualizaciones de RUT y la password no se modificó explícitamente, salimos.
    if (!rutUpdated && !passwordUpdated) {
      console.log(`❕ Sin cambios para ${email}.`);
      return;
    }

    // Aplicar la actualización de RUT si existe y guardar (esto activará el middleware pre('save') para la password)
    if (rutUpdated) {
      user.rut = rutFromCsv;
    }

    await user.save();

    let message = `✅ Actualización exitosa para ${email}.`;
    if (rutUpdated) message += ` Rut actualizado a '${rutFromCsv}'.`;
    if (passwordUpdated)
      message += ` Password actualizada a '${newPlainPassword}' (hasheada).`;

    console.log(message);
  } catch (err) {
    console.error(`❌ Error actualizando para ${row["Mail"]}:`, err.message);
  }
};

// --- PROCESAR CSV ---
const processCsv = async () => {
  const rows = [];
  let successfulUpdates = 0;

  // 1️⃣ Leemos el CSV y acumulamos todas las filas
  try {
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
  } catch (error) {
    console.error("❌ Error leyendo o parseando CSV:", error.message);
    await mongoose.disconnect();
    return;
  }

  console.log(
    `📦 ${rows.length} filas encontradas. Actualizando Ruts y Contraseñas...`
  );

  // 2️⃣ Procesamos secuencialmente
  for (const row of rows) {
    const result = await updateRutAndPassword(row);
    if (result) successfulUpdates++;
  }

  // 3️⃣ Cerramos la conexión
  await mongoose.disconnect();
  console.log(`\n======================================================`);
  console.log(`🎯 Proceso completado. ${rows.length} filas procesadas.`);
  console.log(`======================================================`);
};

// --- EJECUTAR ---
processCsv().catch((err) => {
  console.error("❌ Error general en la ejecución:", err.message);
  mongoose.disconnect();
});

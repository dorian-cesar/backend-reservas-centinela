import mongoose from "mongoose";
import dotenv from "dotenv";
import GeneratedService from "../models/GeneratedService.js";

// Cargar variables de entorno apuntando a la raíz
dotenv.config();

const purgeServices = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.DATABASE_URL; // Ajusta según tu variable en el .env
    
    if (!mongoUri) {
      throw new Error("⚠️ No se encontró la URI de conexión a la base de datos en el archivo .env");
    }

    console.log("⏳ Conectando a la base de datos...");
    await mongoose.connect(mongoUri);
    console.log("✅ Conexión exitosa a MongoDB.");

    // Límite superior: 30 de septiembre de 2026 en UTC
    const cutoffDate = new Date("2026-09-30T23:59:59.999Z");

    console.log(`🧹 Buscando y eliminando servicios posteriores al: ${cutoffDate.toISOString()}`);
    
    const result = await GeneratedService.deleteMany({
      date: { $gt: cutoffDate }
    });

    console.log(`🎉 ¡Operación completada exitosamente!`);
    console.log(`🗑️  Cantidad de servicios eliminados: ${result.deletedCount}`);

  } catch (error) {
    console.error("❌ Error al ejecutar el script de purga:", error);
  } finally {
    // Es muy importante cerrar la conexión para que el proceso de Node termine de ejecutarse
    await mongoose.disconnect();
    console.log("🔌 Conexión a MongoDB cerrada.");
    process.exit(0);
  }
};

purgeServices();

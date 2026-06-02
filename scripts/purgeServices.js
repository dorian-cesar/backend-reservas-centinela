import mongoose from "mongoose";
import dotenv from "dotenv";
import GeneratedService from "../models/GeneratedService.js";

dotenv.config();

const purgeServices = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.DATABASE_URL;
    await mongoose.connect(mongoUri);
    console.log("✅ Conectión exitosa a MongoDB.");

    // Muestra los últimos 3 servicios para ver cómo se guarda la propiedad "date"
    const sampleServices = await GeneratedService.find({}).sort({ date: -1 }).limit(3);
    
    console.log("\n📋 [DIAGNÓSTICO] Últimos servicios encontrados en la base de datos:");
    if (sampleServices.length === 0) {
      console.log("❌ No se encontraron servicios en la colección.");
    } else {
      sampleServices.forEach(s => {
        console.log(`- ID: ${s._id} | Nombre: ${s.serviceName} | Fecha Real (date): ${s.date} (${typeof s.date})`);
      });
    }

    // Filtro flexible: Probamos buscando desde el inicio del 30 de Septiembre
    const cutoffDate = new Date("2026-09-30T00:00:00.000Z");
    console.log(`\n🧹 Intentando borrar servicios con fecha mayor a: ${cutoffDate.toISOString()}`);
    
    const result = await GeneratedService.deleteMany({
      date: { $gt: cutoffDate }
    });

    console.log(`🗑️  Cantidad de servicios eliminados: ${result.deletedCount}`);

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

purgeServices();

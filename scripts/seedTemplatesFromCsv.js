import fs from "fs";
import path from "path";
import { parse } from "csv-parse";
import mongoose from "mongoose";
import dotenv from "dotenv";
import ServiceTemplate from "../models/ServiceTemplate.js";
import BusLayout from "../models/BusLayout.js";

dotenv.config();
console.log("mongo uri: " + process.env.MONGO_URI)
const __dirname = path.resolve();

// Configuración de mapeo de días
const DAYS_MAP = {
  'DOMINGO': 7,
  'LUNES': 1,
  'MARTES': 2,
  'MIERCOLES': 3,
  'JUEVES': 4,
  'VIERNES': 5,
  'SABADO': 6
};

async function processCsv() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Conectado a MongoDB, uri: " + process.env.MONGO_URI);

    // 1. Obtener o crear layout de bus
    let layout = await BusLayout.findOne();
    if (!layout) {
      console.log("🔧 No hay layouts de bus. Creando uno por defecto...");
      layout = await createDefaultLayout();
    }

    // 2. Verificar el número máximo actual para logging
    const maxTemplate = await ServiceTemplate.findOne().sort({ serviceNumber: -1 });
    const startNumber = maxTemplate ? maxTemplate.serviceNumber + 1 : 100;
    console.log(`🔢 Iniciando con serviceNumber: ${startNumber}`);

    // 3. Leer y procesar el CSV
    const csvFilePath = path.join(
      __dirname,
      "Servicios Regulares Transporte Personal Centinela (1).xlsx - Table 2(1).csv"
    );

    if (!fs.existsSync(csvFilePath)) {
      console.log("❌ Archivo CSV no encontrado:", csvFilePath);
      return;
    }

    const csvData = fs.readFileSync(csvFilePath, 'utf8');

    const records = await new Promise((resolve, reject) => {
      parse(csvData, {
        delimiter: ',',
        skip_empty_lines: true,
        relax_quotes: true,
        trim: true,
        relax_column_count: true
      }, (err, records) => {
        if (err) reject(err);
        else resolve(records);
      });
    });

    console.log(`📊 Procesando ${records.length} filas del CSV...`);

    // 4. Procesar datos y crear templates
    let currentSection = '';
    let currentDay = '';
    let templatesCreated = 0;
    let skippedRows = 0;

    for (let i = 0; i < records.length; i++) {
      const row = records[i];

      // Detectar sección (filas que contienen "Servicios")
      if (row[1] && row[1].includes('Servicios')) {
        currentSection = row[1];
        console.log(`\n🏙️  Procesando: ${currentSection}`);
        continue;
      }

      // Detectar día (primera columna tiene nombre de día)
      if (row[0] && DAYS_MAP[row[0].toUpperCase()]) {
        currentDay = row[0].toUpperCase();
        console.log(`   📅 Día: ${currentDay}`);
        continue;
      }

      // Saltar filas completamente vacías
      if (row.every(cell => !cell || cell.trim() === '')) {
        continue;
      }

      // Saltar encabezados de tabla
      if (row[1] === 'DIRECCION' || row[2] === 'ORIGEN' || row[3] === 'DESTINO') {
        continue;
      }

      // Saltar "Sin Servicio"
      if (row[1]?.includes('Sin Servicio') || row[2]?.includes('Sin Servicio')) {
        console.log(`   ⏭️  Sin servicio: ${currentDay}`);
        continue;
      }

      // Procesar servicio
      const direccion = cleanText(row[1]);
      const origin = cleanText(row[2]);
      const destination = cleanText(row[3]);
      const time = cleanTime(row[4]);
      const description = cleanText(row[5]);

      // Validar que tenemos los datos mínimos
      if (origin && destination && time && currentDay) {
        const result = await createTemplate({
          origin,
          destination,
          time,
          description: description || `${direccion} ${currentSection}`,
          day: currentDay,
          layout: layout._id
        });

        if (result) {
          templatesCreated++;
          // 🔥 MOSTRAR EL NÚMERO Y NOMBRE ASIGNADO
          console.log(`   ✅ ${currentDay.slice(0, 3)}: #${result.serviceNumber} ${result.origin} -> ${result.destination} ${result.time}`);
        }
      } else {
        skippedRows++;
        console.log(`   ❌ Fila ${i} ignorada - Datos insuficientes:`, {
          origin, destination, time, currentDay
        });
      }
    }

    console.log(`\n🎯 Proceso completado!`);
    console.log(`✅ ${templatesCreated} templates creados con números de servicio`);
    console.log(`⏭️  ${skippedRows} filas ignoradas`);

    // Mostrar resumen de templates creados
    if (templatesCreated > 0) {
      const newTemplates = await ServiceTemplate.find()
        .sort({ serviceNumber: -1 })
        .limit(5);

      console.log(`\n📋 Últimos templates creados:`);
      newTemplates.forEach(template => {
        console.log(`   #${template.serviceNumber}: ${template.serviceName}`);
      });
    }

  } catch (error) {
    console.error("❌ Error procesando CSV:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Conexión cerrada");
  }
}

// Función para crear template individual
async function createTemplate(service) {
  try {
    const templateData = {
      origin: service.origin,
      destination: service.destination,
      startDate: new Date(), // Fecha actual como inicio
      time: service.time,
      company: "Transporte Personal Centinela",
      layout: service.layout,
      daysOfWeek: [DAYS_MAP[service.day]]
    };

    // Verificar si ya existe un template idéntico (ahora incluye serviceNumber)
    const exists = await ServiceTemplate.findOne({
      origin: templateData.origin,
      destination: templateData.destination,
      time: templateData.time,
      daysOfWeek: templateData.daysOfWeek
    });

    if (exists) {
      console.log(`   ⚠️  Duplicado: #${exists.serviceNumber} ${service.origin} -> ${service.destination} ${service.time}`);
      return null;
    }

    // 🔥 CREAR TEMPLATE - El middleware se encargará de generar serviceNumber y serviceName
    const template = await ServiceTemplate.create(templateData);

    return template;
  } catch (error) {
    console.error(`   ❌ Error creando template: ${error.message}`);
    return null;
  }
}

// Función para crear layout por defecto (sin cambios)
async function createDefaultLayout() {
  try {
    const defaultLayout = {
      name: "bus_centinela",
      rows: 10,
      columns: 5,
      pisos: 1,
      capacidad: 38,
      tipo_Asiento_piso_1: "Salón-Cama",
      floor1: {
        seatMap: [
          ["1", "2", "", "4", "3"],
          ["5", "6", "", "8", "7"],
          ["9", "10", "", "12", "11"],
          ["13", "14", "", "16", "15"],
          ["17", "18", "", "20", "19"],
          ["21", "22", "", "24", "23"],
          ["25", "26", "", "28", "27"],
          ["29", "30", "", "32", "31"],
          ["33", "34", "", "36", "35"],
          ["37", "38", "", "WC", "WC"]
        ]
      },
      floor2: {}
    };

    const layout = await BusLayout.create(defaultLayout);
    console.log("✅ Layout por defecto creado:", layout.name);
    return layout;
  } catch (error) {
    console.error("❌ Error creando layout por defecto:", error);
    throw error;
  }
}

// Funciones auxiliares (sin cambios)
function cleanText(text) {
  if (!text || text === '""') return '';
  return text.toString().trim().replace(/\s+/g, ' ');
}

function cleanTime(time) {
  if (!time) return '';
  const cleaned = time.toString().replace(/[^0-9:]/g, '').trim();
  return cleaned;
}

// Ejecutar el script
processCsv().catch(console.error);
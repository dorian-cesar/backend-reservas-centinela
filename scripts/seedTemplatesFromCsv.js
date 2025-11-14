import fs from "fs";
import path from "path";
import { parse } from "csv-parse";
import mongoose from "mongoose";
import dotenv from "dotenv";
import ServiceTemplate from "../models/ServiceTemplate.js";
import BusLayout from "../models/BusLayout.js";

dotenv.config();

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
    console.log("✅ Conectado a MongoDB");

    // 1. Obtener o crear layout de bus
    let layout = await BusLayout.findOne();
    if (!layout) {
      console.log("🔧 No hay layouts de bus. Creando uno por defecto...");
      layout = await createDefaultLayout();
    }

    // 2. Leer y procesar el CSV
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
        relax_column_count: true // Permite filas con diferente número de columnas
      }, (err, records) => {
        if (err) reject(err);
        else resolve(records);
      });
    });

    console.log(`📊 Procesando ${records.length} filas del CSV...`);

    // 3. Procesar datos y crear templates
    let currentSection = '';
    let currentDay = '';
    let templatesCreated = 0;
    let skippedRows = 0;

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      
      console.log(`Fila ${i}:`, JSON.stringify(row)); // DEBUG

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

      // Procesar servicio - las columnas están en:
      // [0]: vacío o dirección repetida
      // [1]: DIRECCION (Subida/Bajada)
      // [2]: ORIGEN
      // [3]: DESTINO  
      // [4]: HORA SALIDA
      // [5]: DESCRIPCION
      // [6]: RECORRIDO

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
        }
      } else {
        skippedRows++;
        console.log(`   ❌ Fila ${i} ignorada - Datos insuficientes:`, {
          origin, destination, time, currentDay
        });
      }
    }

    console.log(`\n🎯 Proceso completado!`);
    console.log(`✅ ${templatesCreated} templates creados`);
    console.log(`⏭️  ${skippedRows} filas ignoradas`);

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

    // Verificar si ya existe un template idéntico
    const exists = await ServiceTemplate.findOne({
      origin: templateData.origin,
      destination: templateData.destination, 
      time: templateData.time,
      daysOfWeek: templateData.daysOfWeek
    });

    if (exists) {
      console.log(`   ⚠️  Duplicado: ${service.origin} -> ${service.destination} ${service.time}`);
      return null;
    }

    const template = await ServiceTemplate.create(templateData);
    console.log(`   ✅ ${service.day.slice(0,3)}: ${service.origin} -> ${service.destination} ${service.time}`);
    
    return template;
  } catch (error) {
    console.error(`   ❌ Error creando template: ${error.message}`);
    return null;
  }
}

// Función para crear layout por defecto
async function createDefaultLayout() {
  try {
    const defaultLayout = {
      name: "Bus Standard 40 Asientos",
      pisos: 1,
      capacidad: 40,
      tipo_Asiento_piso_1: "Standard",
      floor1: {
        seatMap: [
          ["1A", "1B", "", "1C", "1D"],
          ["2A", "2B", "", "2C", "2D"],
          ["3A", "3B", "", "3C", "3D"],
          ["4A", "4B", "", "4C", "4D"],
          ["5A", "5B", "", "5C", "5D"],
          ["6A", "6B", "", "6C", "6D"],
          ["7A", "7B", "", "7C", "7D"],
          ["8A", "8B", "", "8C", "8D"],
          ["9A", "9B", "", "9C", "9D"],
          ["10A", "10B", "", "10C", "10D"]
        ]
      }
    };

    const layout = await BusLayout.create(defaultLayout);
    console.log("✅ Layout por defecto creado:", layout.name);
    return layout;
  } catch (error) {
    console.error("❌ Error creando layout por defecto:", error);
    throw error;
  }
}

// Funciones auxiliares
function cleanText(text) {
  if (!text || text === '""') return '';
  return text.toString().trim().replace(/\s+/g, ' ');
}

function cleanTime(time) {
  if (!time) return '';
  // Limpiar tiempos con (*) u otros caracteres, mantener formato HH:MM
  const cleaned = time.toString().replace(/[^0-9:]/g, '').trim();
  return cleaned;
}

// Ejecutar el script
processCsv().catch(console.error);
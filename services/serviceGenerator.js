import ServiceTemplate from "../models/ServiceTemplate.js";
import GeneratedService from "../models/GeneratedService.js";
import BusLayout from "../models/BusLayout.js";

/**
 * Construye el array seats a partir de un layout
 * Retorna un array de asientos con { seatNumber, floor, status }
 */
export const buildSeatsFromLayout = (layout) => {
  const seats = [];

  // Piso 1
  if (layout.floor1?.seatMap) {
    layout.floor1.seatMap.forEach((row) => {
      row.forEach((seat) => {
        if (seat && seat !== "") {
          seats.push({
            seatNumber: seat,
            floor: 1,
            status: "available",
          });
        }
      });
    });
  }

  // Piso 2
  if (layout.floor2?.seatMap) {
    layout.floor2.seatMap.forEach((row) => {
      row.forEach((seat) => {
        if (seat && seat !== "") {
          seats.push({
            seatNumber: seat,
            floor: 2,
            status: "available",
          });
        }
      });
    });
  }

  return seats;
};

/**
 * Genera varios días para una plantilla (similar a generateOne pero programático).
 * windowDays = cantidad de días a generar desde startDate (por defecto 14)
 * Devuelve array de servicios creados.
 */
export const generateForTemplate = async (templateId, windowDays = 14) => {
  const t = await ServiceTemplate.findById(templateId);
  if (!t) throw new Error("Template no encontrada");

  const layout = await BusLayout.findById(t.layout);
  if (!layout) throw new Error("Layout no encontrado");

  const created = [];
  const start = new Date(t.startDate);

  for (let i = 0; i < windowDays; i++) {
    const currentDate = new Date(start);
    currentDate.setDate(start.getDate() + i);

    const dayOfWeek = currentDate.getDay() === 0 ? 7 : currentDate.getDay();
    if (!t.daysOfWeek.includes(dayOfWeek)) continue;

    // Evitar duplicados por fecha/template
    const startOfDay = new Date(currentDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(currentDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const exists = await GeneratedService.findOne({
      template: t._id,
      date: { $gte: startOfDay, $lte: endOfDay },
    });
    if (exists) continue;

    const seats = buildSeatsFromLayout(layout);

    const newService = await GeneratedService.create({
      template: t._id,
      date: currentDate,
      time: t.time,
      origin: t.origin,
      destination: t.destination,
      busLayout: layout._id,
      seats,
    });

    created.push(newService);
  }

  return created;
};

/**
 * Encuentra la última fecha generada para una plantilla y crea UN servicio
 * para la siguiente fecha válida según daysOfWeek.
 * - Si ya existe la siguiente fecha (por algún motivo), no crea duplicado.
 * - Devuelve el servicio creado o null si no se creó nada.
 */
export const extendTemplateByOneDay = async (templateId) => {
  const t = await ServiceTemplate.findById(templateId);
  if (!t) throw new Error("Template no encontrada");

  const layout = await BusLayout.findById(t.layout);
  if (!layout) throw new Error("Layout no encontrado");

  // Encontrar la última GeneratedService para esta template por fecha
  const last = await GeneratedService.findOne({ template: t._id })
    .sort({ date: -1 })
    .limit(1);

  // Si no hay servicios generados aún, tomamos startDate - 1 (para que nextDate empiece desde startDate)
  let cursorDate;
  if (!last) {
    // tomar startDate - 1 día para que el siguiente día tomado sea startDate (si corresponde a daysOfWeek)
    cursorDate = new Date(t.startDate);
    cursorDate.setDate(cursorDate.getDate() - 1);
  } else {
    cursorDate = new Date(last.date);
  }

  // Buscamos la Próxima fecha > cursorDate que cumpla daysOfWeek
  // Para evitar loops infinitos, limitamos a buscar en los próximos 365 días (seguro que hay algún día)
  let attempts = 0;
  let nextDate = null;
  const maxAttempts = 365;
  let probe = new Date(cursorDate);

  while (attempts < maxAttempts) {
    probe.setDate(probe.getDate() + 1); // avanzar un día
    const dayOfWeek = probe.getDay() === 0 ? 7 : probe.getDay();
    if (t.daysOfWeek.includes(dayOfWeek)) {
      // verificar duplicado exacto por fecha (same day)
      const startOfDay = new Date(probe);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(probe);
      endOfDay.setUTCHours(23, 59, 59, 999);

      const exists = await GeneratedService.findOne({
        template: t._id,
        date: { $gte: startOfDay, $lte: endOfDay },
      });

      if (!exists) {
        nextDate = new Date(probe);
        break;
      }
      // si existe, seguimos buscando el siguiente día válido
    }
    attempts++;
  }

  if (!nextDate) {
    // no se encontró fecha útil en el rango
    return null;
  }

  // generar asientos y crear servicio
  const seats = buildSeatsFromLayout(layout);

  const newService = await GeneratedService.create({
    template: t._id,
    date: nextDate,
    time: t.time,
    origin: t.origin,
    destination: t.destination,
    busLayout: layout._id,
    seats,
  });

  return newService;
};

/**
 * Extiende todas las plantillas generando 1 día adicional para cada una (si corresponde)
 * Devuelve resumen con contadores y servicios creados.
 */
export const extendAllTemplatesByOneDay = async () => {
  const templates = await ServiceTemplate.find();
  const results = {
    totalTemplates: templates.length,
    createdCount: 0,
    createdServices: [],
    errors: [],
  };

  for (const t of templates) {
    try {
      const created = await extendTemplateByOneDay(t._id);
      if (created) {
        results.createdCount += 1;
        results.createdServices.push(created);
      }
    } catch (err) {
      // no detener todo si una plantilla falla
      results.errors.push({ templateId: t._id, message: err.message });
    }
  }

  return results;
};

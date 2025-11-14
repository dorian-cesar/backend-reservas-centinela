// controllers/serviceController.js

import ServiceTemplate from "../models/ServiceTemplate.js";
import GeneratedService from "../models/GeneratedService.js";
import BusLayout from "../models/BusLayout.js";

// ====================================================
// Crear nuevo template
// ====================================================
export const createTemplate = async (req, res) => {
  try {
    const template = await ServiceTemplate.create(req.body);
    res.json(template);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// ====================================================
// Listar templates
// ====================================================
export const listTemplates = async (req, res) => {
  try {
    const templates = await ServiceTemplate.find().populate("layout");
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ====================================================
// Generar servicios por 14 días desde startDate
// usando daysOfWeek [1..7]
// ====================================================
export const generateServices = async (req, res) => {
  try {
    const templates = await ServiceTemplate.find();

    for (const t of templates) {
      const start = new Date(t.startDate);

      // generar 14 días desde startDate
      for (let i = 0; i < 14; i++) {
        const currentDate = new Date(start);
        currentDate.setDate(start.getDate() + i);

        // convertir getDay() -> 1=Lunes ... 7=Domingo
        const dayOfWeek = currentDate.getDay() === 0 ? 7 : currentDate.getDay();

        if (!t.daysOfWeek.includes(dayOfWeek)) continue;

        // ================================
        // Cargar layout y generar asientos
        // ================================
        const layout = await BusLayout.findById(t.layout);
        if (!layout) continue;

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

        // Crear servicio generado
        await GeneratedService.create({
          template: t._id,
          date: currentDate,
          time: t.time,
          origin: t.origin,
          destination: t.destination,
          busLayout: layout._id,
          seats,
        });
      }
    }

    res.json({
      message: "Servicios generados exitosamente con asientos incluidos por 14 días",
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const generateOne = async (req, res) => {
  try {
    const templateId = req.params.id;
    if (!templateId) {
      return res.status(400).json({ error: "Debes enviar el id de la template en params" });
    }

    const t = await ServiceTemplate.findById(templateId);
    if (!t) {
      return res.status(404).json({ error: "Template no encontrada" });
    }

    const start = new Date(t.startDate);
    const createdServices = [];

    for (let i = 0; i < 14; i++) {
      const currentDate = new Date(start);
      currentDate.setDate(start.getDate() + i);

      // convertir getDay() -> 1=Lunes ... 7=Domingo
      const dayOfWeek = currentDate.getDay() === 0 ? 7 : currentDate.getDay();

      if (!t.daysOfWeek.includes(dayOfWeek)) continue;

      // ================================
      // Cargar layout y generar asientos
      // ================================
      const layout = await BusLayout.findById(t.layout);
      if (!layout) continue;

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
                // si quieres la forma original (reserved/reservedBy) usa:
                // reserved: false,
                // reservedBy: null
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

      // Crear servicio generado
      const newService = await GeneratedService.create({
        template: t._id,
        date: currentDate,
        time: t.time,
        origin: t.origin,
        destination: t.destination,
        busLayout: layout._id,
        seats,
      });

      createdServices.push(newService);
    }

    res.json({
      message: `Servicios generados exitosamente para la template ${templateId}`,
      count: createdServices.length,
      services: createdServices,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};




// ====================================================
// Listar servicios generados
// ====================================================
export const listGeneratedServices = async (req, res) => {
  try {
    const services = await GeneratedService.find()
      .populate("template")
      .populate("busLayout");

    res.json(services);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ====================================================
// Eliminar un tem
// ====================================================
// Buscar servicios por origen, destino y fecha
// GET /api/services/search?origin=Santiago&destination=Antofagasta&date=2025-11-15
// ====================================================
export const searchServices = async (req, res) => {
  try {
    const { origin, destination, date } = req.query;

    if (!origin || !destination || !date) {
      return res.status(400).json({
        error: "Debes enviar origin, destination y date (YYYY-MM-DD)",
      });
    }

    const startOfDay = new Date(date + "T00:00:00.000Z");
    const endOfDay = new Date(date + "T23:59:59.999Z");

    const services = await GeneratedService.find({
      origin,
      destination,
      date: { $gte: startOfDay, $lte: endOfDay },
    })
      .populate("template")
      .populate("busLayout");

    res.json(services);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
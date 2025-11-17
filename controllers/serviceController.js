// controllers/serviceController.js

import ServiceTemplate from "../models/ServiceTemplate.js";
import GeneratedService from "../models/GeneratedService.js";
import BusLayout from "../models/BusLayout.js";

/**
 * @swagger
 * /api/services/template:
 *   post:
 *     summary: Crea un nuevo template de servicio.
 *     tags:
 *       - Templates
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ServiceTemplate'
 *     responses:
 *       200:
 *         description: Template creado exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServiceTemplate'
 *       400:
 *         description: Error de validación o datos incorrectos.
 */
export const createTemplate = async (req, res) => {
  try {
    const template = await ServiceTemplate.create(req.body);
    res.json(template);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * @swagger
 * /api/services/generate:
 *   post:
 *     summary: Genera servicios para todos los templates por 14 días desde la fecha de inicio.
 *     tags:
 *       - Servicios
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Servicios generados exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Error interno del servidor.
 */
export const generateServices = async (req, res) => {
  try {
    const templates = await ServiceTemplate.find();

    for (const t of templates) {
      const start = new Date(t.startDate);

      for (let i = 0; i < 14; i++) {
        const currentDate = new Date(start);
        currentDate.setDate(start.getDate() + i);

        // convertir getDay() -> 1=Lunes ... 7=Domingo
        const dayOfWeek = currentDate.getDay() === 0 ? 7 : currentDate.getDay();

        if (!t.daysOfWeek.includes(dayOfWeek)) continue;

        // Cargar layout y generar asientos
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

/**
 * @swagger
 * /api/services/generateOne/{id}:
 *   post:
 *     summary: Genera servicios para un template específico por 14 días desde la fecha de inicio.
 *     tags:
 *       - Servicios
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del template.
 *     responses:
 *       200:
 *         description: Servicios generados exitosamente para el template.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 count:
 *                   type: integer
 *                 services:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/GeneratedService'
 *       400:
 *         description: Falta el ID del template.
 *       404:
 *         description: Template no encontrado.
 *       500:
 *         description: Error interno del servidor.
 */
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

      // Cargar layout y generar asientos
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

/**
 * @swagger
 * /api/services/search:
 *   get:
 *     summary: Busca servicios generados por origen, destino y fecha.
 *     tags:
 *       - Servicios
 *     parameters:
 *       - in: query
 *         name: origin
 *         required: true
 *         schema:
 *           type: string
 *         description: Ciudad de origen.
 *       - in: query
 *         name: destination
 *         required: true
 *         schema:
 *           type: string
 *         description: Ciudad de destino.
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha del servicio (YYYY-MM-DD).
 *     responses:
 *       200:
 *         description: Lista de servicios encontrados.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/GeneratedService'
 *       400:
 *         description: Faltan parámetros requeridos.
 *       500:
 *         description: Error interno del servidor.
 */
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
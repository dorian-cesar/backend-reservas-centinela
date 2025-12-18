import ServiceTemplate from "../models/ServiceTemplate.js";
import GeneratedService from "../models/GeneratedService.js";
import BusLayout from "../models/BusLayout.js";

//helper
const formatDateOnly = (d) => {
  if (!d) return null;
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return null;
  return dt.toISOString().split("T")[0]; // corta la hora
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
    const templates = await ServiceTemplate.find({ active: true });

    for (const t of templates) {
      const start = new Date(t.startDate);

      // Validar que el template tenga serviceNumber y serviceName
      if (!t.serviceNumber || !t.serviceName) {
        console.warn(
          `⚠️  Template ${t._id} sin serviceNumber/serviceName, saltando...`
        );
        continue;
      }

      for (let i = 0; i < 56; i++) {
        const currentDate = new Date(start);
        currentDate.setDate(start.getDate() + i);

        const dayOfWeek = currentDate.getDay() === 0 ? 7 : currentDate.getDay();
        if (!t.daysOfWeek.includes(dayOfWeek)) continue;

        const layout = await BusLayout.findById(t.layout);
        if (!layout) {
          console.warn(
            `⚠️  Layout no encontrado para template ${t._id}, saltando...`
          );
          continue;
        }

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

        // 🔥 Asegurar que serviceName y serviceNumber no sean null
        const serviceName =
          t.serviceName || `${t.origin} → ${t.destination} ${t.time}`;
        const serviceNumber = t.serviceNumber || 0;

        await GeneratedService.create({
          template: t._id,
          date: currentDate,
          time: t.time,
          origin: t.origin,
          destination: t.destination,
          busLayout: layout._id,
          serviceName: serviceName,
          serviceNumber: serviceNumber,
          seats,
        });

        console.log(`✅ Servicio creado: ${serviceName}`);
      }
    }

    res.json({
      message:
        "Servicios generados exitosamente con asientos incluidos por 14 días",
    });
  } catch (error) {
    console.error("Error en generateServices:", error);
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
      return res
        .status(400)
        .json({ error: "Debes enviar el id de la template en params" });
    }

    const t = await ServiceTemplate.findById(templateId);
    if (!t) {
      return res.status(404).json({ error: "Template no encontrada" });
    }

    const createdServices = [];

    const start = new Date(t.startDate);
    const startUTC = new Date(Date.UTC(
      start.getUTCFullYear(),
      start.getUTCMonth(),
      start.getUTCDate()
    ));

    console.log(`startDate raw: ${t.startDate}`);
    console.log(`startDate UTC normalized: ${startUTC.toISOString()}`);
    console.log(`Template daysOfWeek: ${t.daysOfWeek}`);

    for (const dayOfWeek of t.daysOfWeek) {
      for (let week = 0; week < 2; week++) {
        const serviceUTC = new Date(startUTC);

        const currentDayOfWeek =
          serviceUTC.getUTCDay() === 0 ? 7 : serviceUTC.getUTCDay();

        let daysToAdd = dayOfWeek - currentDayOfWeek;

        if (daysToAdd < 0) {
          daysToAdd += 7;
        }

        daysToAdd += week * 7;

        serviceUTC.setUTCDate(startUTC.getUTCDate() + daysToAdd);

        const normalizedDate = new Date(Date.UTC(
          serviceUTC.getUTCFullYear(),
          serviceUTC.getUTCMonth(),
          serviceUTC.getUTCDate()
        ));

        console.log(
          `Generando servicio: día ${dayOfWeek}, semana ${week}, fecha UTC: ${normalizedDate.toISOString()}`
        );

        const layout = await BusLayout.findById(t.layout);
        if (!layout) continue;

        const seats = [];

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
          date: normalizedDate,
          time: t.time,
          origin: t.origin,
          destination: t.destination,
          busLayout: layout._id,
          serviceName: t.serviceName,
          serviceNumber: t.serviceNumber,
          seats,
        });

        createdServices.push(newService);
      }
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

    const formatted = services.map((service) => ({
      ...service.toObject(),
      date: formatDateOnly(service.date),
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getServicesByNumber = async (req, res) => {
  try {
    const { serviceNumber, date } = req.query;

    // Validar que serviceNumber esté presente
    if (!serviceNumber) {
      return res.status(400).json({
        error: "Debes enviar serviceNumber (número del servicio)",
      });
    }

    // Convertir serviceNumber a número
    const number = parseInt(serviceNumber);
    if (isNaN(number)) {
      return res.status(400).json({
        error: "serviceNumber debe ser un número válido",
      });
    }

    // Construir query base
    let query = { serviceNumber: number };

    // Si se proporciona fecha, agregar filtro de fecha
    if (date) {
      const startOfDay = new Date(date + "T00:00:00.000Z");
      const endOfDay = new Date(date + "T23:59:59.999Z");

      query.date = { $gte: startOfDay, $lte: endOfDay };
    }

    // Buscar servicios
    const services = await GeneratedService.find(query)
      .populate("template")
      .populate("busLayout")
      .sort({ date: date ? 1 : -1 }); // Si hay fecha, orden ascendente, sino descendente

    // Si no se encontraron servicios
    if (services.length === 0) {
      const message = date
        ? `No se encontraron servicios con número ${number} para la fecha ${date}`
        : `No se encontraron servicios con número ${number}`;

      return res.status(404).json({
        error: message,
        serviceNumber: number,
        date: date || "No especificada",
      });
    }

    // Enriquecer respuesta con información adicional
    const enrichedServices = services.map((service) => {
      const serviceObj = service.toObject();
      const now = new Date();
      const serviceDateTime = new Date(service.date);
      const timeDiffHours = (serviceDateTime - now) / (1000 * 60 * 60);

      return {
        ...serviceObj,
        timeRemaining: `${Math.max(0, timeDiffHours).toFixed(1)} horas`,
        isPast: timeDiffHours < 0,
        isToday: serviceDateTime.toDateString() === now.toDateString(),
        canBeReleased: timeDiffHours > 48,
      };
    });

    res.json({
      services: enrichedServices,
      total: enrichedServices.length,
      serviceNumber: number,
      dateFilter: date || "Todas las fechas",
      templateInfo: services[0]?.template
        ? {
          origin: services[0].template.origin,
          destination: services[0].template.destination,
          time: services[0].template.time,
          daysOfWeek: services[0].template.daysOfWeek,
        }
        : null,
    });
  } catch (error) {
    console.error("Error en getServicesByNumber:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getGeneratedServices = async (req, res) => {
  try {
    const {
      serviceNumber,
      origin,
      destination,
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = req.query;

    // Construir query
    const query = {};

    if (serviceNumber) {
      query.serviceNumber = parseInt(serviceNumber);
    }

    if (origin) {
      query.origin = new RegExp(origin, 'i');
    }

    if (destination) {
      query.destination = new RegExp(destination, 'i');
    }

    // Filtro por rango de fechas
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate + "T00:00:00.000Z");
      }
      if (endDate) {
        query.date.$lte = new Date(endDate + "T23:59:59.999Z");
      }
    }

    // Paginación
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;

    // Consulta SIN populate de template (puede no existir)
    const [services, total] = await Promise.all([
      GeneratedService.find(query)
        .populate("busLayout") // Solo el layout que siempre existe
        .sort({ date: 1, time: 1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      GeneratedService.countDocuments(query)
    ]);

    // Formatear fechas
    const formattedServices = services.map(service => ({
      ...service,
      date: formatDateOnly(service.date),
      // Agregar información básica incluso si template fue eliminado
      serviceInfo: {
        serviceNumber: service.serviceNumber,
        serviceName: service.serviceName,
        origin: service.origin,
        destination: service.destination,
        time: service.time,
        date: formatDateOnly(service.date)
      }
    }));

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: formattedServices,
      pagination: {
        total,
        totalPages,
        page: pageNum,
        limit: limitNum
      }
    });

  } catch (error) {
    console.error("Error en getGeneratedServices:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const deleteGeneratedServices = async (req, res) => {
  try {
    const { serviceNumber } = req.params;
    const { fromDate } = req.body;

    if (!fromDate) {
      return res.status(400).json({
        success: false,
        error: "El parámetro 'fromDate' es requerido"
      });
    }

    if (!serviceNumber) {
      return res.status(400).json({
        success: false,
        error: "El parámetro 'serviceNumber' es requerido"
      });
    }

    const serviceNumberInt = parseInt(serviceNumber);
    if (isNaN(serviceNumberInt)) {
      return res.status(400).json({
        success: false,
        error: "serviceNumber debe ser un número válido"
      });
    }

    // Buscar algunos servicios para mostrar información antes de eliminar
    const sampleServices = await GeneratedService.find({
      serviceNumber: serviceNumberInt,
      date: { $gte: new Date(fromDate + "T00:00:00.000Z") }
    })
      .sort({ date: 1 })
      .limit(5)
      .lean();

    // Ejecutar eliminación
    const result = await GeneratedService.deleteMany({
      serviceNumber: serviceNumberInt,
      date: {
        $gte: new Date(fromDate + "T00:00:00.000Z")
      }
    });

    // Información para la respuesta
    const serviceInfo = sampleServices.length > 0 ? {
      serviceName: sampleServices[0].serviceName,
      origin: sampleServices[0].origin,
      destination: sampleServices[0].destination
    } : null;

    res.json({
      success: true,
      message: `Servicios con número ${serviceNumberInt} eliminados exitosamente desde ${fromDate}`,
      deletedCount: result.deletedCount,
      serviceNumber: serviceNumberInt,
      fromDate: formatDateOnly(fromDate),
      ...serviceInfo
    });

  } catch (error) {
    console.error("Error en deleteServicesByNumber:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const deleteGeneratedServiceById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: "Debes enviar el id del servicio"
      });
    }

    const service = await GeneratedService.findById(id);

    if (!service) {
      return res.status(404).json({
        success: false,
        error: "Servicio no encontrado"
      });
    }

    const hasConfirmedSeats = service.seats.some(seat => seat.confirmed);

    if (hasConfirmedSeats) {
      return res.status(409).json({
        success: false,
        error: "No se puede eliminar un servicio con asientos confirmados"
      });
    }

    await service.deleteOne();

    res.json({
      success: true,
      message: "Servicio eliminado correctamente",
      deletedService: {
        id: service._id,
        serviceNumber: service.serviceNumber,
        serviceName: service.serviceName,
        origin: service.origin,
        destination: service.destination,
        date: service.date?.toISOString().split("T")[0]
      }
    });

  } catch (error) {
    console.error("Error deleteGeneratedServiceById:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
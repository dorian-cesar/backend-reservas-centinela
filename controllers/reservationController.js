import GeneratedService from "../models/GeneratedService.js";
import Reservation from "../models/Reservation.js";
import { sendReservationEmailNotification } from "../services/mailService.js";

/**
 * @swagger
 * /api/reservations/reserve:
 *   post:
 *     summary: Crea una reserva temporal de un asiento por 10 minutos.
 *     description: Reserva un asiento específico para un usuario durante 10 minutos en un servicio generado.
 *     tags:
 *       - Reservations
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - serviceId
 *               - seatNumber
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID del usuario que realiza la reserva.
 *               serviceId:
 *                 type: string
 *                 description: ID del servicio donde se reserva el asiento.
 *               seatNumber:
 *                 type: string
 *                 description: Número del asiento a reservar.
 *     responses:
 *       200:
 *         description: Reserva creada exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 reservation:
 *                   $ref: '#/components/schemas/Reservation'
 *                 expiresAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Solicitud inválida o asiento no disponible.
 *       404:
 *         description: Servicio no encontrado.
 *       500:
 *         description: Error interno del servidor.
 */
export const makeReservation = async (req, res) => {
  try {
    const { userId, serviceId, seatNumber } = req.body;

    if (!userId || !serviceId || !seatNumber) {
      return res.status(400).json({ message: "userId, serviceId y seatNumber son requeridos" });
    }

    const service = await GeneratedService.findById(serviceId);
    if (!service)
      return res.status(404).json({ message: "Servicio no encontrado" });

    const cleanInput = seatNumber.trim().toUpperCase();
    const seat = service.seats.find(
        (s) => s.seatNumber.trim().toUpperCase() === cleanInput
    );

    if (!seat) {
      return res.status(400).json({
        message: "Asiento no existe en este servicio",
        debug: { buscado: cleanInput },
      });
    }

    if (seat.reserved || seat.confirmed) {
      return res.status(400).json({ message: "Asiento no disponible" });
    }

    const reservationExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    seat.reserved = true;
    seat.reservedBy = userId;
    seat.reservationExpiresAt = reservationExpiresAt;

    await service.save();

    // Crear registro de reserva con expiresAt
    const reservation = await Reservation.create({
      user: userId,
      service: serviceId,
      seatNumber: cleanInput,
      status: "reserved",
      expiresAt: reservationExpiresAt,
    });

    res.json({
      message: "Reserva creada por 10 minutos",
      reservation,
      expiresAt: reservationExpiresAt
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error interno" });
  }
};

/**
 * @swagger
 * /api/reservations/confirm:
 *   post:
 *     summary: Confirma una reserva después del pago.
 *     description: Confirma una reserva existente, marcando el asiento como confirmado tras el pago.
 *     tags:
 *       - Reservations
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reservationId
 *               - authorizationCode
 *             properties:
 *               reservationId:
 *                 type: string
 *                 description: ID de la reserva a confirmar.
 *               authorizationCode:
 *                 type: string
 *                 description: Código de autorización del pago.
 *     responses:
 *       200:
 *         description: Reserva confirmada exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 reservation:
 *                   $ref: '#/components/schemas/Reservation'
 *       400:
 *         description: Reserva no activa o asiento no existe.
 *       404:
 *         description: Reserva no encontrada.
 *       500:
 *         description: Error interno del servidor.
 */
export const confirmReservation = async (req, res) => {
  try {
    const { reservationId, authorizationCode } = req.body;
    if (!reservationId || !authorizationCode) {
      return res.status(400).json({ message: "reservationId y authorizationCode son requeridos" });
    }

    const reservation = await Reservation.findById(reservationId);
    if (!reservation) return res.status(404).json({ message: "Reserva no encontrada" });
    if (reservation.status !== "reserved") return res.status(400).json({ message: "La reserva no está activa" });

    // Verificar expiración antes de intentar confirmar
    if (reservation.expiresAt && new Date() > new Date(reservation.expiresAt)) {
      reservation.status = "expired";
      await reservation.save();
      // Intentamos liberar asiento por seguridad (no crítico si falla)
      await GeneratedService.updateOne(
          { _id: reservation.service, "seats.seatNumber": reservation.seatNumber },
          { $set: { "seats.$.reserved": false, "seats.$.reservedBy": null, "seats.$.reservationExpiresAt": null } }
      );
      return res.status(400).json({ message: "La reserva expiró" });
    }

    const updateResult = await GeneratedService.updateOne(
        {
          _id: reservation.service,
          "seats": {
            $elemMatch: {
              seatNumber: reservation.seatNumber,
              reserved: true,
              reservedBy: reservation.user, // requiere que reservedBy coincida
              confirmed: { $ne: true } // solo si no está ya confirmado
            }
          }
        },
        {
          $set: {
            "seats.$.confirmed": true,
            "seats.$.confirmedBy": reservation.user,
            "seats.$.reserved": true,
            "seats.$.reservedBy": reservation.user,
            "seats.$.reservationExpiresAt": null
          }
        }
    );

    if (updateResult.modifiedCount === 0) {
      // nadie actualizó: posible race o asiento no era del usuario
      return res.status(400).json({ message: "No se pudo confirmar el asiento: ya fue tomado o no pertenece a la reserva" });
    }

    // Si llegamos acá, el asiento fue confirmado en el documento del servicio
    reservation.status = "confirmed";
    reservation.authorizationCode = authorizationCode;
    await reservation.save();

    // Poblar para enviar correo
    const populatedReservation = await Reservation.findById(reservation._id).populate("user").populate("service");

    // Envío de correo asincrónico (no bloquea la respuesta)
    sendReservationEmailNotification(populatedReservation)
        .then(() => console.log(`Correo enviado para reserva ${reservation._id}`))
        .catch((err) => console.error(`Error enviando correo para reserva ${reservation._id}:`, err));

    res.json({ message: "Reserva confirmada", reservation: populatedReservation });
  } catch (error) {
    console.error("Error confirmReservationNoTxn:", error);
    res.status(500).json({ message: "Error interno" });
  }
};

/**
 * @swagger
 * /api/reservations/release:
 *   post:
 *     summary: Libera un asiento manualmente o por cancelación.
 *     description: Cambia el estado de la reserva y del asiento a liberado.
 *     tags:
 *       - Reservations
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reservationId
 *             properties:
 *               reservationId:
 *                 type: string
 *                 description: ID de la reserva a liberar.
 *     responses:
 *       200:
 *         description: Asiento liberado exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 reservation:
 *                   $ref: '#/components/schemas/Reservation'
 *       400:
 *         description: Asiento no existe.
 *       404:
 *         description: Reserva no encontrada.
 *       500:
 *         description: Error interno del servidor.
 */
export const releaseSeat = async (req, res) => {
  try {
    const { reservationId } = req.body;

    const reservation = await Reservation.findById(reservationId);
    if (!reservation)
      return res.status(404).json({ message: "Reserva no encontrada" });

    const service = await GeneratedService.findById(reservation.service);
    const seat = service.seats.find(
        (s) => s.seatNumber === reservation.seatNumber
    );

    if (!seat) return res.status(400).json({ message: "Asiento no existe" });

    // Liberar asiento
    seat.reserved = true;
    seat.reservedBy = null;
    seat.reservationExpiresAt = null;

    await service.save();

    reservation.status = "released";
    await reservation.save();

    res.json({ message: "Asiento liberado", reservation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error interno" });
  }
};

/**
 * @swagger
 * /api/reservations/release-seat:
 *   post:
 *     summary: Libera un asiento con validación de tiempo y permisos.
 *     description: Libera un asiento reservado o confirmado por el usuario, validando que el usuario tenga permisos y que el asiento pertenezca a él.
 *     tags:
 *       - Reservations
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - serviceId
 *               - seatNumber
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID del usuario que solicita la liberación.
 *               serviceId:
 *                 type: string
 *                 description: ID del servicio.
 *               seatNumber:
 *                 type: string
 *                 description: Número del asiento a liberar.
 *     responses:
 *       200:
 *         description: Asiento liberado exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 reservation:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     seatNumber:
 *                       type: string
 *                     status:
 *                       type: string
 *                     releasedAt:
 *                       type: string
 *                       format: date-time
 *                 serviceInfo:
 *                   type: object
 *                   properties:
 *                     date:
 *                       type: string
 *                     time:
 *                       type: string
 *                     origin:
 *                       type: string
 *                     destination:
 *                       type: string
 *       400:
 *         description: Solicitud inválida o asiento no reservado.
 *       403:
 *         description: El usuario no tiene permisos para liberar el asiento.
 *       404:
 *         description: Servicio o reserva no encontrada.
 *       500:
 *         description: Error interno del servidor.
 */
export const releaseSeatWithTimeValidation = async (req, res) => {
  try {
    const { userId, serviceId, seatNumber } = req.body;

    // Validar datos requeridos
    if (!userId || !serviceId || !seatNumber) {
      return res.status(400).json({
        message: "Se requieren userId, serviceId y seatNumber",
      });
    }

    // Buscar el servicio
    const service = await GeneratedService.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: "Servicio no encontrado" });
    }

    // Buscar el asiento en el servicio
    const cleanInput = seatNumber.trim().toUpperCase();
    const seat = service.seats.find(
        (s) => s.seatNumber.trim().toUpperCase() === cleanInput
    );

    if (!seat) {
      return res.status(400).json({
        message: "Asiento no existe en este servicio",
        debug: { buscado: cleanInput },
      });
    }

    // Verificar que el asiento esté reservado/confirmado por el usuario
    if (!seat.reserved && !seat.confirmed) {
      return res.status(400).json({
        message: "El asiento no está reservado",
      });
    }

    // Si está confirmado, verificar que pertenezca al usuario
    if (seat.confirmed && seat.confirmedBy.toString() !== userId.toString()) {
      return res.status(403).json({
        message: "No tienes permisos para liberar este asiento",
      });
    }

    // Si está reservado, verificar que pertenezca al usuario
    if (seat.reserved && seat.reservedBy.toString() !== userId.toString()) {
      return res.status(403).json({
        message: "No tienes permisos para liberar este asiento",
      });
    }

    // Buscar la reserva activa
    const reservation = await Reservation.findOne({
      user: userId,
      service: serviceId,
      seatNumber: cleanInput,
      status: { $in: ["reserved", "confirmed"] },
    });

    if (!reservation) {
      return res.status(404).json({
        message: "No se encontró una reserva activa para este asiento",
      });
    }

    // Liberar el asiento en el servicio
    seat.reserved = false;
    seat.reservedBy = null;
    seat.confirmed = false;
    seat.confirmedBy = null;
    seat.reservationExpiresAt = null;

    await service.save();

    // Actualizar el estado de la reserva
    reservation.status = "released";
    reservation.releasedAt = new Date();
    await reservation.save();

    res.json({
      message: "Asiento liberado exitosamente",
      reservation: {
        id: reservation._id,
        seatNumber: reservation.seatNumber,
        status: reservation.status,
        releasedAt: reservation.releasedAt,
      },
      serviceInfo: {
        date: service.date,
        time: service.time,
        origin: service.origin,
        destination: service.destination,
      },
    });
  } catch (error) {
    console.error("Error liberando asiento:", error);
    res.status(500).json({
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

/**
 * @swagger
 * /api/reservations/user/{userId}/active:
 *   get:
 *     summary: Obtiene las reservas activas de un usuario con información del servicio.
 *     description: Retorna las reservas activas (reserved o confirmed) de un usuario, incluyendo información relevante del servicio y si puede liberarse.
 *     tags:
 *       - Reservations
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario.
 *     responses:
 *       200:
 *         description: Lista de reservas activas del usuario.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reservations:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       reservationId:
 *                         type: string
 *                       seatNumber:
 *                         type: string
 *                       status:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       serviceId:
 *                         type: string
 *                       serviceDate:
 *                         type: string
 *                       serviceTime:
 *                         type: string
 *                       origin:
 *                         type: string
 *                       destination:
 *                         type: string
 *                       canBeReleased:
 *                         type: boolean
 *                       timeRemaining:
 *                         type: string
 *                       hoursRemaining:
 *                         type: number
 *                 total:
 *                   type: integer
 *       500:
 *         description: Error interno del servidor.
 */
export const getUserActiveReservations = async (req, res) => {
  try {
    const { userId } = req.params;

    // Buscar solo reservas activas (reserved o confirmed)
    const reservations = await Reservation.find({
      user: userId,
      status: { $in: ["reserved", "confirmed"] },
    })
        .populate("service")
        .sort({ createdAt: -1 });

    // Enriquecer con información de tiempo restante y si puede liberarse
    const activeReservations = reservations.map((reservation) => {
      const service = reservation.service;
      const now = new Date();
      const serviceDateTime = new Date(service.date);
      const timeDiffHours = (serviceDateTime - now) / (1000 * 60 * 60);

      return {
        reservationId: reservation._id,
        seatNumber: reservation.seatNumber,
        status: reservation.status,
        createdAt: reservation.createdAt,
        serviceId: service._id,
        serviceDate: service.date,
        serviceTime: service.time,
        origin: service.origin,
        destination: service.destination,
        canBeReleased: timeDiffHours > 48,
        timeRemaining: `${Math.max(0, timeDiffHours).toFixed(1)} horas`,
        hoursRemaining: timeDiffHours,
      };
    });

    res.json({
      reservations: activeReservations,
      total: activeReservations.length,
    });
  } catch (error) {
    console.error("Error obteniendo reservas activas:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

/**
 * @swagger
 * /api/reservations/user/{userId}/history:
 *   get:
 *     summary: Obtiene el historial de reservas de un usuario.
 *     description: Retorna el historial de reservas de un usuario, incluyendo todas las reservas (released, cancelled, expired, etc.).
 *     tags:
 *       - Reservations
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario.
 *     responses:
 *       200:
 *         description: Historial de reservas del usuario.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 history:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       reservationId:
 *                         type: string
 *                       seatNumber:
 *                         type: string
 *                       status:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       serviceDate:
 *                         type: string
 *                       serviceTime:
 *                         type: string
 *                       origin:
 *                         type: string
 *                       destination:
 *                         type: string
 *                 total:
 *                   type: integer
 *       500:
 *         description: Error interno del servidor.
 */
export const getUserReservationHistory = async (req, res) => {
  try {
    const { userId } = req.params;

    const reservations = await Reservation.find({ user: userId })
        .populate("service")
        .sort({ createdAt: -1 })
        .limit(50); // Limitar historial

    const history = reservations.map((reservation) => {
      const service = reservation.service;

      return {
        reservationId: reservation._id,
        seatNumber: reservation.seatNumber,
        status: reservation.status,
        createdAt: reservation.createdAt,
        serviceDate: service?.date || null,
        serviceTime: service?.time || null,
        origin: service?.origin || null,
        destination: service?.destination || null,
      };
    });

    res.json({
      history,
      total: history.length,
    });
  } catch (error) {
    console.error("Error obteniendo historial:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};
/**
 * @swagger
 * /api/reservations/user/{userId}/reserved:
 *   get:
 *     summary: Obtiene los asientos reservados temporalmente por un usuario.
 *     description: "Retorna las reservas temporales (status: reserved) de un usuario, incluyendo información de tiempo restante y si puede liberarse."
 *     tags:
 *       - Reservations
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario.
 *     responses:
 *       200:
 *         description: Lista de asientos reservados temporalmente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reservedSeats:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       reservationId:
 *                         type: string
 *                       seatNumber:
 *                         type: string
 *                       status:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       expiresAt:
 *                         type: string
 *                         format: date-time
 *                       minutesLeft:
 *                         type: integer
 *                       serviceId:
 *                         type: string
 *                       serviceDate:
 *                         type: string
 *                       serviceTime:
 *                         type: string
 *                       origin:
 *                         type: string
 *                       destination:
 *                         type: string
 *                       canBeReleased:
 *                         type: boolean
 *                       timeRemaining:
 *                         type: string
 *                       hoursRemaining:
 *                         type: number
 *                 total:
 *                   type: integer
 *       500:
 *         description: Error interno del servidor.
 */
export const getUserReservedSeats = async (req, res) => {
  try {
    const { userId } = req.params;

    // Buscar solo reservas temporales (reserved)
    const reservations = await Reservation.find({
      user: userId,
      status: "reserved"
    })
        .populate("service")
        .sort({ createdAt: -1 });

    // Enriquecer con información de tiempo restante para la reserva
    const reservedSeats = reservations.map((reservation) => {
      const service = reservation.service;
      const now = new Date();
      const reservationExpiresAt = new Date(reservation.expiresAt);
      const reservationTimeLeft = (reservationExpiresAt - now) / (1000 * 60); // minutos restantes

      const serviceDateTime = new Date(service.date);
      const timeDiffHours = (serviceDateTime - now) / (1000 * 60 * 60);

      return {
        reservationId: reservation._id,
        seatNumber: reservation.seatNumber,
        status: reservation.status,
        createdAt: reservation.createdAt,
        expiresAt: reservation.expiresAt,
        minutesLeft: Math.max(0, Math.floor(reservationTimeLeft)),
        serviceId: service._id,
        serviceDate: service.date,
        serviceTime: service.time,
        origin: service.origin,
        destination: service.destination,
        canBeReleased: timeDiffHours > 48,
        timeRemaining: `${Math.max(0, timeDiffHours).toFixed(1)} horas`,
        hoursRemaining: timeDiffHours,
      };
    });

    res.json({
      reservedSeats,
      total: reservedSeats.length,
    });
  } catch (error) {
    console.error("Error obteniendo asientos reservados:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

/**
 * @swagger
 * /api/reservations/user/{userId}/reserved:
 *   get:
 *     summary: Obtiene los asientos reservados temporalmente por un usuario.
 *     description: "Retorna las reservas temporales (status: reserved) de un usuario, incluyendo información de tiempo restante y si puede liberarse."
 *     tags:
 *       - Reservations
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario.
 *     responses:
 *       200:
 *         description: Lista de asientos reservados temporalmente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reservedSeats:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       reservationId:
 *                         type: string
 *                       seatNumber:
 *                         type: string
 *                       status:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       expiresAt:
 *                         type: string
 *                         format: date-time
 *                       minutesLeft:
 *                         type: integer
 *                       serviceId:
 *                         type: string
 *                       serviceDate:
 *                         type: string
 *                       serviceTime:
 *                         type: string
 *                       origin:
 *                         type: string
 *                       destination:
 *                         type: string
 *                       canBeReleased:
 *                         type: boolean
 *                       timeRemaining:
 *                         type: string
 *                       hoursRemaining:
 *                         type: number
 *                 total:
 *                   type: integer
 *       500:
 *         description: Error interno del servidor.
 */
export const getUserConfirmedReservations = async (req, res) => {
  try {
    const { userId } = req.params;

    // Buscar solo reservas confirmadas
    const reservations = await Reservation.find({
      user: userId,
      status: "confirmed"
    })
        .populate({
          path: "service",
          populate: [
            { path: "template" },
            { path: "busLayout" }
          ]
        })
        .sort({ createdAt: -1 });


    const serviceMap = new Map();

    reservations.forEach((reservation) => {
      const service = reservation.service;

      if (!serviceMap.has(service._id.toString())) {
        // Primera vez que vemos este servicio, crear entrada base
        serviceMap.set(service._id.toString(), {
          ...service.toObject(),
          userReservations: [] // Array para las reservas de este usuario en este servicio
        });
      }

      // Agregar la reserva específica a este servicio
      const serviceEntry = serviceMap.get(service._id.toString());
      serviceEntry.userReservations.push({
        reservationId: reservation._id,
        seatNumber: reservation.seatNumber,
        reservationCreatedAt: reservation.createdAt,
        authorizationCode: reservation.authorizationCode
      });
    });

    // Convertir el mapa a array y enriquecer con información de tiempo
    const servicesWithReservations = Array.from(serviceMap.values()).map(service => {
      const now = new Date();
      const serviceDateTime = new Date(service.date);
      const timeDiffHours = (serviceDateTime - now) / (1000 * 60 * 60);

      return {
        _id: service._id,
        template: service.template,
        date: service.date,
        origin: service.origin,
        destination: service.destination,
        busLayout: service.busLayout,
        seats: service.seats,
        time: service.time,
        // Información específica del usuario
        userReservations: service.userReservations,
        canBeReleased: timeDiffHours > 48,
        timeRemaining: `${Math.max(0, timeDiffHours).toFixed(1)} horas`,
        hoursRemaining: timeDiffHours,
        // Metadata
        totalUserSeats: service.userReservations.length,
        releaseDeadline: new Date(serviceDateTime.getTime() - (48 * 60 * 60 * 1000)) // Fecha límite para liberar
      };
    });

    res.json(servicesWithReservations);

  } catch (error) {
    console.error("Error obteniendo reservas confirmadas:", error);
    res.status(500).json({ error: error.message });
  }
};
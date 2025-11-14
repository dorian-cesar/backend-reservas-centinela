import GeneratedService from "../models/GeneratedService.js";
import Reservation from "../models/Reservation.js";

/**
 * 1) Crear una reserva por 10 minutos
 */
export const makeReservation = async (req, res) => {
  try {
    const { userId, serviceId, seatNumber } = req.body;

    const service = await GeneratedService.findById(serviceId);
    if (!service)
      return res.status(404).json({ message: "Servicio no encontrado" });

    //const seat = service.seats.find((s) => s.seatNumber === seatNumber);

    const cleanInput = seatNumber.trim().toUpperCase();

    const seat = service.seats.find(
      (s) => s.seatNumber.trim().toUpperCase() === cleanInput
    );
    //console.log(seat);
    if (!seat) {
      return res.status(400).json({
        message: "Asiento no existe en este servicio",
        debug: { buscado: cleanInput },
      });
    }

    if (seat.reserved || seat.confirmed) {
      return res.status(400).json({ message: "Asiento no disponible" });
    }
    // Marcar asiento como reservado temporalmente
    seat.reserved = true;
    seat.reservedBy = userId;
    seat.reservationExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    await service.save();

    // Crear registro de reserva
    const reservation = await Reservation.create({
      user: userId,
      service: serviceId,
      seatNumber,
      status: "reserved",
      expiresAt: seat.reservationExpiresAt,
    });

    res.json({ message: "Reserva creada por 10 minutos", reservation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error interno" });
  }
};

/**
 * 2) Confirmar reserva después del pago
 */
export const confirmReservation = async (req, res) => {
  try {
    const { reservationId, authorizationCode } = req.body;

    const reservation = await Reservation.findById(reservationId);
    if (!reservation)
      return res.status(404).json({ message: "Reserva no encontrada" });

    if (reservation.status !== "reserved")
      return res.status(400).json({ message: "La reserva no está activa" });

    const service = await GeneratedService.findById(reservation.service);
    const seat = service.seats.find(
      (s) => s.seatNumber === reservation.seatNumber
    );

    if (!seat) return res.status(400).json({ message: "Asiento no existe" });

    // Validar expiración
    if (new Date() > new Date(reservation.expiresAt)) {
      seat.reserved = false;
      seat.reservedBy = null;
      seat.reservationExpiresAt = null;
      await service.save();

      reservation.status = "expired";
      await reservation.save();

      return res.status(400).json({ message: "La reserva expiró" });
    }

    // Confirmar asiento
    seat.confirmed = true;
    seat.confirmedBy = reservation.user;
    seat.reserved = false;
    seat.reservedBy = null;

    await service.save();

    reservation.status = "confirmed";
    reservation.authorizationCode = authorizationCode;
    await reservation.save();

    res.json({ message: "Reserva confirmada", reservation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error interno" });
  }
};

/**
 * 3) Liberar asiento manualmente o por cancelación
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
    seat.reserved = false;
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



export const releaseSeatWithTimeValidation = async (req, res) => {
  try {
    const { userId, serviceId, seatNumber } = req.body;

    // Validar datos requeridos
    if (!userId || !serviceId || !seatNumber) {
      return res.status(400).json({
        message: "Se requieren userId, serviceId y seatNumber"
      });
    }

    // Buscar el servicio
    const service = await GeneratedService.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: "Servicio no encontrado" });
    }

    // Validar que el servicio sea futuro y tenga más de 48 horas
    const now = new Date();
    const serviceDateTime = new Date(service.date);

    // Calcular diferencia en horas
    const timeDiffHours = (serviceDateTime - now) / (1000 * 60 * 60);

    if (timeDiffHours <= 48) {
      return res.status(400).json({
        message: "No se puede liberar el asiento. Faltan menos de 48 horas para el servicio",
        timeRemaining: `${timeDiffHours.toFixed(1)} horas`,
        cutoffTime: "48 horas antes del servicio"
      });
    }

    // Buscar el asiento en el servicio
    const cleanInput = seatNumber.trim().toUpperCase();
    const seat = service.seats.find(
      (s) => s.seatNumber.trim().toUpperCase() === cleanInput
    );

    if (!seat) {
      return res.status(400).json({
        message: "Asiento no existe en este servicio",
        debug: { buscado: cleanInput }
      });
    }

    // Verificar que el asiento esté reservado/confirmado por el usuario
    if (!seat.reserved && !seat.confirmed) {
      return res.status(400).json({
        message: "El asiento no está reservado"
      });
    }

    // Si está confirmado, verificar que pertenezca al usuario
    if (seat.confirmed && seat.confirmedBy.toString() !== userId.toString()) {
      return res.status(403).json({
        message: "No tienes permisos para liberar este asiento"
      });
    }

    // Si está reservado, verificar que pertenezca al usuario
    if (seat.reserved && seat.reservedBy.toString() !== userId.toString()) {
      return res.status(403).json({
        message: "No tienes permisos para liberar este asiento"
      });
    }

    // Buscar la reserva activa
    const reservation = await Reservation.findOne({
      user: userId,
      service: serviceId,
      seatNumber: cleanInput,
      status: { $in: ["reserved", "confirmed"] }
    });

    if (!reservation) {
      return res.status(404).json({
        message: "No se encontró una reserva activa para este asiento"
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
        releasedAt: reservation.releasedAt
      },
      serviceInfo: {
        date: service.date,
        time: service.time,
        origin: service.origin,
        destination: service.destination
      }
    });

  } catch (error) {
    console.error("Error liberando asiento:", error);
    res.status(500).json({
      message: "Error interno del servidor",
      error: error.message
    });
  }
};

/**
 * 5) Obtener reservas de un usuario con información del servicio
 */
export const getUserActiveReservations = async (req, res) => {
  try {
    const { userId } = req.params;

    // Buscar solo reservas activas (reserved o confirmed)
    const reservations = await Reservation.find({
      user: userId,
      status: { $in: ["reserved", "confirmed"] }
    })
      .populate("service")
      .sort({ createdAt: -1 });

    // Enriquecer con información de tiempo restante y si puede liberarse
    const activeReservations = reservations.map(reservation => {
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
        hoursRemaining: timeDiffHours
      };
    });

    res.json({
      reservations: activeReservations,
      total: activeReservations.length
    });

  } catch (error) {
    console.error("Error obteniendo reservas activas:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

/**
 * 6) Obtener historial de reservas (todas incluyendo released, cancelled, expired)
 */
export const getUserReservationHistory = async (req, res) => {
  try {
    const { userId } = req.params;

    const reservations = await Reservation.find({ user: userId })
      .populate("service")
      .sort({ createdAt: -1 })
      .limit(50); // Limitar historial

    const history = reservations.map(reservation => {
      const service = reservation.service;

      return {
        reservationId: reservation._id,
        seatNumber: reservation.seatNumber,
        status: reservation.status,
        createdAt: reservation.createdAt,
        serviceDate: service?.date || null,
        serviceTime: service?.time || null,
        origin: service?.origin || null,
        destination: service?.destination || null
      };
    });

    res.json({
      history,
      total: history.length
    });

  } catch (error) {
    console.error("Error obteniendo historial:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};
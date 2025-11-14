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

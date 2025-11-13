import GeneratedService from "../models/GeneratedService.js";
import Reservation from "../models/Reservation.js";

export const makeReservation = async (req, res) => {
  const { userId, serviceId, seatNumber } = req.body;

  const service = await GeneratedService.findById(serviceId);
  const seat = service.seats.find((s) => s.seatNumber === seatNumber);

  if (!seat || seat.reserved) return res.status(400).json({ message: "Asiento no disponible" });

  seat.reserved = true;
  seat.reservedBy = userId;

  await service.save();
  const reservation = await Reservation.create({ user: userId, service: serviceId, seatNumber });

  res.json({ message: "Reserva creada", reservation });
};

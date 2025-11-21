import ServiceTemplate from "../models/ServiceTemplate.js";
import GeneratedService from "../models/GeneratedService.js";
import BusLayout from "../models/BusLayout.js";


//helper
const formatDateOnly = (d) => {
    if (!d) return null;
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return null;
    return dt.toISOString().split("T")[0];
};

export const getServiceReport = async (req, res) => {
    try {
        const { serviceId } = req.params;

        const service = await GeneratedService.findById(serviceId)
            .populate("template")
            .populate({
                path: "seats.reservedBy",
                select: "name email rut"
            })
            .populate({
                path: "seats.confirmedBy",
                select: "name email rut"
            })
            .populate("busLayout"); // <<< importante: poblar el layout

        if (!service) {
            return res.status(404).json({ error: "Servicio no encontrado" });
        }

        // Helper: contar asientos válidos en un busLayout (lee seatMap si existe)
        const countSeatsFromLayout = (layout) => {
            if (!layout) return 0;
            // intento leer floor1, floor2, ... dinámicamente
            let total = 0;
            for (const key of Object.keys(layout)) {
                if (!key.startsWith("floor")) continue;
                const floor = layout[key];
                if (!floor || !Array.isArray(floor.seatMap)) continue;
                for (const row of floor.seatMap) {
                    for (const cell of row) {
                        if (cell && String(cell).trim() !== "" && String(cell).trim().toUpperCase() !== "WC") {
                            total += 1;
                        }
                    }
                }
            }
            // fallback: si layout tiene campo 'capacidad' válido, preferirlo
            if (layout.capacidad && Number.isInteger(layout.capacidad)) {
                return layout.capacidad;
            }
            return total;
        };

        // Procesar información de pasajeros
        const passengers = service.seats
            .filter(seat => seat.confirmed || seat.reserved)
            .map(seat => {
                const passenger = seat.confirmed ? seat.confirmedBy : seat.reservedBy;
                return {
                    seatNumber: seat.seatNumber,
                    floor: seat.floor,
                    passengerName: passenger?.name || "N/A",
                    passengerEmail: passenger?.email || "N/A",
                    passengerRut: passenger?.rut || "N/A",
                    status: seat.confirmed ? "confirmado" : "reservado",
                    // reservationDate: seat.reservationExpiresAt
                };
            });

        // Información del servicio
        const serviceInfo = {
            serviceNumber: service.serviceNumber,
            serviceName: service.serviceName,
            origin: service.origin,
            destination: service.destination,
            date: formatDateOnly(service.date),
            time: service.template?.time || "N/A",
            busLayout: service.busLayout?.name || "N/A"
        };

        // Calcular totalSeats con prioridad: busLayout.capacidad -> seatMap -> seats array (excluyendo WC)
        let totalSeats = 0;
        if (service.busLayout) {
            totalSeats = countSeatsFromLayout(service.busLayout);
            // Si countSeatsFromLayout devolvió 0 pero existe capacidad numérica, usarla:
            if (!totalSeats && service.busLayout.capacidad) totalSeats = service.busLayout.capacidad;
        } else {
            // fallback: contar en service.seats excluyendo 'WC' y vacíos
            totalSeats = service.seats.filter(s => s.seatNumber && String(s.seatNumber).trim().toUpperCase() !== "WC").length;
        }

        // Resumen
        const summary = {
            totalSeats,
            confirmedPassengers: service.seats.filter(seat => seat.confirmed).length,
            reservedSeats: service.seats.filter(seat => seat.reserved && !seat.confirmed).length,
            availableSeats: service.seats.filter(seat =>
                !seat.reserved && !seat.confirmed && seat.seatNumber && String(seat.seatNumber).trim().toUpperCase() !== "WC"
            ).length
        };

        res.json({
            serviceInfo,
            passengers,
            summary
        });

    } catch (error) {
        console.error("Error en getServiceReport:", error);
        res.status(500).json({ error: error.message });
    }
};

export const getDateRangeReport = async (req, res) => {
    try {
        const { startDate, endDate, origin, destination } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({
                error: "Debes enviar startDate y endDate (YYYY-MM-DD)"
            });
        }

        const start = new Date(startDate + "T00:00:00.000Z");
        const end = new Date(endDate + "T23:59:59.999Z");

        // Construir query base
        let query = {
            date: { $gte: start, $lte: end }
        };

        // Agregar filtros opcionales
        if (origin) query.origin = origin;
        if (destination) query.destination = destination;

        // Helper: contar asientos válidos en un busLayout (lee seatMap si existe)
        const countSeatsFromLayout = (layout) => {
            if (!layout) return 0;
            // Si layout tiene 'capacidad' numérica y válida, preferirla
            if (layout.capacidad && Number.isInteger(layout.capacidad)) return layout.capacidad;

            let total = 0;
            for (const key of Object.keys(layout)) {
                if (!key.startsWith("floor")) continue;
                const floor = layout[key];
                if (!floor || !Array.isArray(floor.seatMap)) continue;
                for (const row of floor.seatMap) {
                    for (const cell of row) {
                        if (cell && String(cell).trim() !== "" && String(cell).trim().toUpperCase() !== "WC") {
                            total += 1;
                        }
                    }
                }
            }
            return total;
        };

        const services = await GeneratedService.find(query)
            .populate("template")
            .populate("busLayout")
            .populate({
                path: "seats.confirmedBy",
                select: "name email"
            })
            .sort({ date: 1, "template.time": 1 });

        // Procesar servicios para el reporte
        const serviceReports = services.map(service => {
            const confirmedPassengers = (service.seats || []).filter(seat => seat.confirmed).length;
            const totalPassengers = (service.seats || []).filter(seat => seat.confirmed || seat.reserved).length;

            // calcular totalSeats con prioridad a busLayout.capacidad/seatMap, fallback a seats array excluyendo WC
            let totalSeats = 0;
            if (service.busLayout) {
                totalSeats = countSeatsFromLayout(service.busLayout);
                if (!totalSeats && service.busLayout.capacidad) totalSeats = service.busLayout.capacidad;
            }
            if (!totalSeats) {
                totalSeats = (service.seats || []).filter(s => s.seatNumber && String(s.seatNumber).trim().toUpperCase() !== "WC").length;
            }

            const availableSeats = Math.max(0, totalSeats - totalPassengers);

            return {
                serviceId: service._id,
                serviceNumber: service.serviceNumber,
                serviceName: service.serviceName,
                origin: service.origin,
                destination: service.destination,
                date: formatDateOnly(service.date),
                time: service.template?.time || "N/A",
                totalPassengers,
                confirmedPassengers,
                totalSeats,
                availableSeats
            };
        });

        // Calcular resumen general
        const totalServices = serviceReports.length;
        const totalPassengers = serviceReports.reduce((sum, s) => sum + (s.totalPassengers || 0), 0);
        const totalConfirmed = serviceReports.reduce((sum, s) => sum + (s.confirmedPassengers || 0), 0);
        const totalSeats = serviceReports.reduce((sum, s) => sum + (s.totalSeats || 0), 0);
        const occupancyRate = totalSeats > 0 ? ((totalPassengers / totalSeats) * 100).toFixed(2) + "%" : "0%";

        res.json({
            period: {
                startDate: formatDateOnly(start),
                endDate: formatDateOnly(end),
                origin: origin || "Todos",
                destination: destination || "Todos"
            },
            services: serviceReports,
            summary: {
                totalServices,
                totalPassengers,
                totalConfirmed,
                occupancyRate,
                averagePassengersPerService: totalServices > 0 ? (totalPassengers / totalServices).toFixed(2) : 0
            }
        });

    } catch (error) {
        console.error("Error en getDateRangeReport:", error);
        res.status(500).json({ error: error.message });
    }
};

export const getPassengersReport = async (req, res) => {
    try {
        const { serviceId } = req.params;

        const service = await GeneratedService.findById(serviceId)
            .populate("template")
            .populate({
                path: "seats.reservedBy",
                select: "name email rut"
            })
            .populate({
                path: "seats.confirmedBy",
                select: "name email rut"
            })
            .populate("busLayout"); // <- poblar para obtener name, capacidad, etc.

        if (!service) {
            return res.status(404).json({ error: "Servicio no encontrado" });
        }

        // Helper para normalizar seatNumber y detectar WC/vacío
        const normalizeSeat = (seatNumber) => {
            if (seatNumber === undefined || seatNumber === null) return "";
            return String(seatNumber).trim();
        };

        const isValidSeatCell = (seatNumber) => {
            const s = normalizeSeat(seatNumber).toUpperCase();
            return s !== "" && s !== "WC";
        };

        // Construir lista de pasajeros (excluye WC / celdas vacías)
        const passengers = service.seats
            .filter(seat => (seat.confirmed || seat.reserved) && isValidSeatCell(seat.seatNumber))
            .map(seat => {
                const passenger = seat.confirmed ? seat.confirmedBy : seat.reservedBy;
                return {
                    seatNumber: normalizeSeat(seat.seatNumber),
                    // floor: seat.floor || null,
                    passengerName: passenger?.name || "N/A",
                    passengerEmail: passenger?.email || "N/A",
                    rut: passenger?.rut || "N/A",
                    status: seat.confirmed ? "confirmado" : "reservado",
                    // reservationDate: seat.reservationExpiresAt ? formatDateOnly(seat.reservationExpiresAt) : "N/A"
                };
            })
            // Orden numérico si es posible, sino por string
            .sort((a, b) => {
                const ra = a.seatNumber.replace(/\D/g, ""); // extrae números
                const rb = b.seatNumber.replace(/\D/g, "");
                const na = ra !== "" ? parseInt(ra, 10) : NaN;
                const nb = rb !== "" ? parseInt(rb, 10) : NaN;

                if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
                if (!Number.isNaN(na)) return -1;
                if (!Number.isNaN(nb)) return 1;
                return a.seatNumber.localeCompare(b.seatNumber, undefined, { numeric: true });
            });

        const confirmedCount = passengers.filter(p => p.status === "confirmado").length;
        const reservedCount = passengers.filter(p => p.status === "reservado").length;

        // Información del servicio
        const serviceInfo = {
            serviceNumber: service.serviceNumber,
            serviceName: service.serviceName,
            origin: service.origin,
            destination: service.destination,
            date: formatDateOnly(service.date),
            time: service.template?.time || "N/A",
            busLayout: service.busLayout?.name || "N/A"
        };

        res.json({
            serviceInfo,
            passengers,
            totalPassengers: passengers.length,
            confirmedCount,
            reservedCount
        });

    } catch (error) {
        console.error("Error en getPassengersReport:", error);
        res.status(500).json({ error: error.message });
    }
};

import cron from 'node-cron';
import GeneratedService from '../models/GeneratedService.js';
import Reservation from '../models/Reservation.js';

export default function startSeatReleaseCron() {
    cron.schedule('* * * * *', async () => {
        try {
            const now = new Date();
            const expiredReservations = await Reservation.find({
                status: 'reserved',
                expiresAt: { $lte: now }
            }).populate('service');

            console.log(`[CRON-SEATS] Encontradas ${expiredReservations.length} reservas expiradas`);

            let releasedCount = 0;
            let errorCount = 0;
            const errors = [];

            // 2. Procesar cada reserva expirada
            for (const reservation of expiredReservations) {
                try {
                    const service = await GeneratedService.findById(reservation.service._id);

                    if (!service) {
                        errors.push(`Servicio no encontrado para reserva ${reservation._id}`);
                        errorCount++;
                        continue;
                    }

                    // Buscar el asiento en el servicio
                    const seat = service.seats.find(
                        s => s.seatNumber === reservation.seatNumber
                    );

                    if (!seat) {
                        errors.push(`Asiento ${reservation.seatNumber} no encontrado en servicio ${service._id}`);
                        errorCount++;
                        continue;
                    }

                    // Verificar que el asiento todavía esté reservado por el mismo usuario
                    if (seat.reserved && seat.reservedBy &&
                        seat.reservedBy.toString() === reservation.user.toString()) {

                        // Liberar el asiento
                        seat.reserved = false;
                        seat.reservedBy = null;
                        seat.reservationExpiresAt = null;

                        await service.save();
                    }

                    // Actualizar el estado de la reserva
                    reservation.status = 'released';
                    reservation.releasedAt = now;
                    reservation.releaseReason = 'expired_automatically';
                    await reservation.save();

                    releasedCount++;

                    console.log(`[CRON-SEATS] Liberado asiento ${reservation.seatNumber} de reserva ${reservation._id}`);

                } catch (error) {
                    errorCount++;
                    errors.push(`Error procesando reserva ${reservation._id}: ${error.message}`);
                    console.error(`[CRON-SEATS] Error en reserva ${reservation._id}:`, error);
                }
            }

            // 3. También limpiar asientos expirados directamente en GeneratedService
            const expiredServices = await GeneratedService.updateMany(
                {
                    'seats.reserved': true,
                    'seats.reservationExpiresAt': { $lte: now }
                },
                {
                    $set: {
                        'seats.$[elem].reserved': false,
                        'seats.$[elem].reservedBy': null,
                        'seats.$[elem].reservationExpiresAt': null
                    }
                },
                {
                    arrayFilters: [
                        {
                            'elem.reserved': true,
                            'elem.reservationExpiresAt': { $lte: now }
                        }
                    ]
                }
            );

            console.log(`[CRON-SEATS] Procesadas ${expiredReservations.length} reservas expiradas`);
            console.log(`[CRON-SEATS] Asientos liberados: ${releasedCount}`);
            console.log(`[CRON-SEATS] Asientos limpiados en servicios: ${expiredServices.modifiedCount}`);

            if (errorCount > 0) {
                console.error(`[CRON-SEATS] Errores: ${errorCount}`, errors);
            }

        } catch (err) {
            console.error('[CRON-SEATS] Error general en cron de liberación de asientos:', err);
        }
    });

    console.log('[CRON-SEATS] Cron de liberación de asientos iniciado (ejecuta cada minuto)');
}
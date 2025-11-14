import cron from 'node-cron';
import { extendAllTemplatesByOneDay } from '../services/serviceGenerator.js';

export default function startExtendServicesCron() {
    cron.schedule('0 1 * * *', async () => {
        try {
            const result = await extendAllTemplatesByOneDay();

            console.log(`[CRON-SERVICES] Procesadas ${result.totalTemplates} templates`);
            console.log(`[CRON-SERVICES] Nuevos servicios creados: ${result.createdCount}`);

            if (result.errors.length > 0) {
                console.error('[CRON-SERVICES] Errores:', result.errors);
            }

        } catch (err) {
            console.error('[CRON-SERVICES] Error al extender servicios:', err);
        }
    });

    console.log('[CRON-SERVICES] Cron de extensión de servicios iniciado');
}

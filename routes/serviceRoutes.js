import express from "express";
import { createTemplate, generateOne, generateServices, searchServices } from "../controllers/serviceController.js";
import { protect } from "../middleware/authMiddleware.js";
const router = express.Router();

/**
 * @swagger
 * /api/services/template:
 *   post:
 *     summary: Crea una nueva plantilla de servicio.
 *     tags:
 *       - Servicios
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               # Definir aquí las propiedades esperadas del cuerpo de la solicitud
 *     responses:
 *       201:
 *         description: Plantilla creada exitosamente.
 *       400:
 *         description: Datos inválidos.
 *       401:
 *         description: No autorizado.
 */
/**
 * Ruta para crear una nueva plantilla de servicio.
 * Requiere autenticación.
 *
 * @name POST /template
 * @function
 * @memberof module:routes/serviceRoutes
 * @param {express.Request} req - Objeto de solicitud de Express.
 * @param {express.Response} res - Objeto de respuesta de Express.
 * @param {Function} next - Función de siguiente middleware.
 */
router.post("/template", protect, createTemplate);

/**
 * @swagger
 * /api/services/generate:
 *   post:
 *     summary: Genera múltiples servicios a partir de una plantilla.
 *     tags:
 *       - Servicios
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               # Definir aquí las propiedades esperadas del cuerpo de la solicitud
 *     responses:
 *       200:
 *         description: Servicios generados exitosamente.
 *       400:
 *         description: Datos inválidos.
 *       401:
 *         description: No autorizado.
 */
/**
 * Ruta para generar múltiples servicios a partir de una plantilla.
 * Requiere autenticación.
 *
 * @name POST /generate
 * @function
 * @memberof module:routes/serviceRoutes
 * @param {express.Request} req - Objeto de solicitud de Express.
 * @param {express.Response} res - Objeto de respuesta de Express.
 * @param {Function} next - Función de siguiente middleware.
 */
router.post("/generate", protect, generateServices);

/**
 * @swagger
 * /api/services/generateOne/{id}:
 *   post:
 *     summary: Genera un servicio individual a partir de una plantilla por ID.
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
 *         description: ID de la plantilla de servicio.
 *     responses:
 *       200:
 *         description: Servicio generado exitosamente.
 *       400:
 *         description: Datos inválidos.
 *       401:
 *         description: No autorizado.
 *       404:
 *         description: Plantilla no encontrada.
 */
/**
 * Ruta para generar un servicio individual a partir de una plantilla especificada por ID.
 * Requiere autenticación.
 *
 * @name POST /generateOne/:id
 * @function
 * @memberof module:routes/serviceRoutes
 * @param {express.Request} req - Objeto de solicitud de Express.
 * @param {express.Response} res - Objeto de respuesta de Express.
 * @param {Function} next - Función de siguiente middleware.
 */
router.post("/generateOne/:id", protect, generateOne);

/**
 * @swagger
 * /api/services/search:
 *   get:
 *     summary: Busca servicios según criterios de consulta.
 *     tags:
 *       - Servicios
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Término de búsqueda.
 *       # Agregar más parámetros de consulta según sea necesario
 *     responses:
 *       200:
 *         description: Lista de servicios encontrados.
 *       400:
 *         description: Parámetros de búsqueda inválidos.
 */
/**
 * Ruta para buscar servicios según criterios de consulta.
 *
 * @name GET /search
 * @function
 * @memberof module:routes/serviceRoutes
 * @param {express.Request} req - Objeto de solicitud de Express.
 * @param {express.Response} res - Objeto de respuesta de Express.
 * @param {Function} next - Función de siguiente middleware.
 */
router.get("/search", searchServices);

/**
 * Exporta el router de servicios.
 *
 * @module routes/serviceRoutes
 */
export default router;

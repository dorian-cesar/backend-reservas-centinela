import express from "express";
import {
  listOrigins,
  listDestinationsByOrigin,
  originDestinationMap,
} from "../controllers/cityController.js";

/**
 * @swagger
 * tags:
 *   name: Cities
 *   description: Endpoints para la gestión de ciudades y rutas
 */

const router = express.Router();

/**
 * @swagger
 * /origins:
 *   get:
 *     summary: Obtiene la lista de ciudades de origen disponibles.
 *     tags: [Cities]
 *     responses:
 *       200:
 *         description: Lista de ciudades de origen.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *       500:
 *         description: Error interno del servidor.
 */
/**
 * Obtiene la lista de ciudades de origen disponibles.
 * @route GET /origins
 * @group Cities
 * @returns {Array.<string>} 200 - Lista de ciudades de origen
 * @returns {Error} 500 - Error interno del servidor
 */
router.get("/origins", listOrigins);

/**
 * @swagger
 * /destinations/{origin}:
 *   get:
 *     summary: Obtiene la lista de destinos disponibles para una ciudad de origen específica.
 *     tags: [Cities]
 *     parameters:
 *       - in: path
 *         name: origin
 *         required: true
 *         schema:
 *           type: string
 *         description: Ciudad de origen
 *     responses:
 *       200:
 *         description: Lista de destinos para la ciudad de origen especificada.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *       404:
 *         description: Ciudad de origen no encontrada.
 *       500:
 *         description: Error interno del servidor.
 */
/**
 * Obtiene la lista de destinos disponibles para una ciudad de origen específica.
 * @route GET /destinations/:origin
 * @group Cities
 * @param {string} origin.path.required - Ciudad de origen
 * @returns {Array.<string>} 200 - Lista de destinos para la ciudad de origen
 * @returns {Error} 404 - Ciudad de origen no encontrada
 * @returns {Error} 500 - Error interno del servidor
 */
router.get("/destinations/:origin", listDestinationsByOrigin);

/**
 * @swagger
 * /map:
 *   get:
 *     summary: Obtiene el mapa completo de ciudades de origen y sus destinos asociados.
 *     tags: [Cities]
 *     responses:
 *       200:
 *         description: Mapa de ciudades de origen y destinos.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties:
 *                 type: array
 *                 items:
 *                   type: string
 *       500:
 *         description: Error interno del servidor.
 */
/**
 * Obtiene el mapa completo de ciudades de origen y sus destinos asociados.
 * @route GET /map
 * @group Cities
 * @returns {Object} 200 - Mapa de ciudades de origen y destinos
 * @returns {Error} 500 - Error interno del servidor
 */
router.get("/map", originDestinationMap);

export default router;

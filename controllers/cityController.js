import ServiceTemplate from "../models/ServiceTemplate.js";

/**
 * @swagger
 * /api/cities/origins:
 *   get:
 *     summary: Lista todas las ciudades de origen sin duplicar.
 *     tags:
 *       - Cities
 *     responses:
 *       200:
 *         description: Lista de ciudades de origen.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 origins:
 *                   type: array
 *                   items:
 *                     type: string
 *       500:
 *         description: Error interno del servidor.
 */

/**
 * Lista todas las ciudades de origen sin duplicar.
 *
 * @function
 * @async
 * @param {import('express').Request} req - Objeto de solicitud HTTP.
 * @param {import('express').Response} res - Objeto de respuesta HTTP.
 * @returns {Promise<void>}
 */
export const listOrigins = async (req, res) => {
  try {
    const origins = await ServiceTemplate.distinct("origin", {
      active: true
    });
    res.json({ origins });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * @swagger
 * /api/cities/destinations/{origin}:
 *   get:
 *     summary: Lista los destinos asociados a un origen específico.
 *     tags:
 *       - Cities
 *     parameters:
 *       - in: path
 *         name: origin
 *         required: true
 *         schema:
 *           type: string
 *         description: Ciudad de origen.
 *     responses:
 *       200:
 *         description: Lista de destinos asociados al origen.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 origin:
 *                   type: string
 *                 destinations:
 *                   type: array
 *                   items:
 *                     type: string
 *       500:
 *         description: Error interno del servidor.
 */

/**
 * Dado un origen, lista sus destinos asociados.
 *
 * @function
 * @async
 * @param {import('express').Request} req - Objeto de solicitud HTTP.
 * @param {import('express').Response} res - Objeto de respuesta HTTP.
 * @returns {Promise<void>}
 */
export const listDestinationsByOrigin = async (req, res) => {
  try {
    const { origin } = req.params;

    const destinations = await ServiceTemplate.distinct("destination", {
      origin,
      active: true
    });

    res.json({
      origin,
      destinations,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * @swagger
 * /api/cities/map:
 *   get:
 *     summary: Obtiene un mapa de origen a destinos agrupados.
 *     tags:
 *       - Cities
 *     responses:
 *       200:
 *         description: Mapa de ciudades de origen y sus destinos asociados.
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
 * Lista de origen → destinos agrupados.
 *
 * @function
 * @async
 * @param {import('express').Request} req - Objeto de solicitud HTTP.
 * @param {import('express').Response} res - Objeto de respuesta HTTP.
 * @returns {Promise<void>}
 */
export const originDestinationMap = async (req, res) => {
  try {
    const templates = await ServiceTemplate.find(
      { active: true },
      "origin destination"
    );

    const map = {};

    templates.forEach((t) => {
      if (!map[t.origin]) map[t.origin] = [];
      if (!map[t.origin].includes(t.destination)) {
        map[t.origin].push(t.destination);
      }
    });

    res.json(map);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
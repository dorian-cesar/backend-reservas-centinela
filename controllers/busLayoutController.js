// controllers/busLayoutController.js
import BusLayout from "../models/BusLayout.js";

/**
 * @swagger
 * /api/layouts:
 *   post:
 *     summary: Crea un nuevo layout de autobús
 *     tags:
 *       - BusLayouts
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BusLayout'
 *     responses:
 *       201:
 *         description: Layout creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BusLayout'
 *       500:
 *         description: Error interno del servidor
 */
/**
 * Crea un nuevo layout de autobús.
 * @function
 * @async
 * @param {import('express').Request} req - Objeto de solicitud HTTP.
 * @param {import('express').Response} res - Objeto de respuesta HTTP.
 * @returns {Promise<void>}
 */
export const createLayout = async (req, res) => {
  try {
    const layout = new BusLayout(req.body);
    await layout.save();
    res.status(201).json(layout);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * @swagger
 * /api/layouts:
 *   get:
 *     summary: Obtiene todos los layouts de autobús
 *     tags:
 *       - BusLayouts
 *     responses:
 *       200:
 *         description: Lista de layouts obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BusLayout'
 *       500:
 *         description: Error interno del servidor
 */
/**
 * Obtiene todos los layouts de autobús.
 * @function
 * @async
 * @param {import('express').Request} req - Objeto de solicitud HTTP.
 * @param {import('express').Response} res - Objeto de respuesta HTTP.
 * @returns {Promise<void>}
 */
export const getLayouts = async (req, res) => {
  try {
    const layouts = await BusLayout.find();
    res.json(layouts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * @swagger
 * /api/layouts/{id}:
 *   get:
 *     summary: Obtiene un layout de autobús por su ID
 *     tags:
 *       - BusLayouts
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del layout de autobús
 *     responses:
 *       200:
 *         description: Layout obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BusLayout'
 *       404:
 *         description: Layout no encontrado
 *       500:
 *         description: Error interno del servidor
 */
/**
 * Obtiene un layout de autobús por su ID.
 * @function
 * @async
 * @param {import('express').Request} req - Objeto de solicitud HTTP.
 * @param {import('express').Response} res - Objeto de respuesta HTTP.
 * @returns {Promise<void>}
 */
export const getLayoutById = async (req, res) => {
  try {
    const layout = await BusLayout.findById(req.params.id);

    if (!layout)
      return res.status(404).json({ error: "Layout no encontrado" });

    res.json(layout);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * @swagger
 * /api/layouts/{id}:
 *   put:
 *     summary: Actualiza un layout de autobús existente
 *     tags:
 *       - BusLayouts
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del layout de autobús
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BusLayout'
 *     responses:
 *       200:
 *         description: Layout actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BusLayout'
 *       404:
 *         description: Layout no encontrado
 *       500:
 *         description: Error interno del servidor
 */
/**
 * Actualiza un layout de autobús existente por su ID.
 * @function
 * @async
 * @param {import('express').Request} req - Objeto de solicitud HTTP.
 * @param {import('express').Response} res - Objeto de respuesta HTTP.
 * @returns {Promise<void>}
 */
export const updateLayout = async (req, res) => {
  try {
    const layout = await BusLayout.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
    );

    if (!layout)
      return res.status(404).json({ error: "Layout no encontrado" });

    res.json(layout);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * @swagger
 * /api/layouts/{id}:
 *   delete:
 *     summary: Elimina un layout de autobús por su ID
 *     tags:
 *       - BusLayouts
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del layout de autobús
 *     responses:
 *       200:
 *         description: Layout eliminado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Layout eliminado correctamente
 *       404:
 *         description: Layout no encontrado
 *       500:
 *         description: Error interno del servidor
 */
/**
 * Elimina un layout de autobús por su ID.
 * @function
 * @async
 * @param {import('express').Request} req - Objeto de solicitud HTTP.
 * @param {import('express').Response} res - Objeto de respuesta HTTP.
 * @returns {Promise<void>}
 */
export const deleteLayout = async (req, res) => {
  try {
    const layout = await BusLayout.findByIdAndDelete(req.params.id);

    if (!layout)
      return res.status(404).json({ error: "Layout no encontrado" });

    res.json({ message: "Layout eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
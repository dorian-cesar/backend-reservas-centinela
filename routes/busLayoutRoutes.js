// routes/busLayoutRoutes.js

import express from "express";
import {
  createLayout,
  getLayouts,
  getLayoutById,
  updateLayout,
  deleteLayout,
} from "../controllers/busLayoutController.js";

const router = express.Router();

/**
 * @swagger
 * /:
 *   post:
 *     summary: Crea un nuevo layout de autobús.
 *     tags:
 *       - BusLayout
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BusLayout'
 *     responses:
 *       201:
 *         description: Layout creado exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BusLayout'
 *       400:
 *         description: Datos inválidos.
 */
router.post("/", createLayout);

/**
 * @swagger
 * /:
 *   get:
 *     summary: Obtiene todos los layouts de autobús.
 *     tags:
 *       - BusLayout
 *     responses:
 *       200:
 *         description: Lista de layouts obtenida exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BusLayout'
 */
router.get("/", getLayouts);

/**
 * @swagger
 * /{id}:
 *   get:
 *     summary: Obtiene un layout de autobús por su ID.
 *     tags:
 *       - BusLayout
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del layout de autobús.
 *     responses:
 *       200:
 *         description: Layout obtenido exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BusLayout'
 *       404:
 *         description: Layout no encontrado.
 */
router.get("/:id", getLayoutById);

/**
 * @swagger
 * /{id}:
 *   put:
 *     summary: Actualiza un layout de autobús existente.
 *     tags:
 *       - BusLayout
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del layout de autobús.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BusLayout'
 *     responses:
 *       200:
 *         description: Layout actualizado exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BusLayout'
 *       400:
 *         description: Datos inválidos.
 *       404:
 *         description: Layout no encontrado.
 */
router.put("/:id", updateLayout);

/**
 * @swagger
 * /{id}:
 *   delete:
 *     summary: Elimina un layout de autobús por su ID.
 *     tags:
 *       - BusLayout
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del layout de autobús.
 *     responses:
 *       200:
 *         description: Layout eliminado exitosamente.
 *       404:
 *         description: Layout no encontrado.
 */
router.delete("/:id", deleteLayout);

export default router;
//comentario de prueba//
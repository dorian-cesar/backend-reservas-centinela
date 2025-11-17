import express from "express";
import { getUsers, deleteUser } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
const router = express.Router();

/**
 * @swagger
 * /:
 *   get:
 *     summary: Obtiene la lista de usuarios
 *     description: Retorna un arreglo con todos los usuarios registrados. Requiere autenticación.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Usuarios
 *     responses:
 *       200:
 *         description: Lista de usuarios obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       401:
 *         description: No autorizado
 */
/**
 * Ruta para obtener todos los usuarios.
 * Requiere autenticación mediante middleware protect.
 */
router.get("/", protect, getUsers);

/**
 * @swagger
 * /{id}:
 *   delete:
 *     summary: Elimina un usuario por ID
 *     description: Elimina un usuario específico identificado por su ID. Requiere autenticación.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Usuarios
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario a eliminar
 *     responses:
 *       200:
 *         description: Usuario eliminado exitosamente
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Usuario no encontrado
 */
/**
 * Ruta para eliminar un usuario por su ID.
 * Requiere autenticación mediante middleware protect.
 */
router.delete("/:id", protect, deleteUser);

/**
 * @module routes/userRoutes
 * @description Rutas relacionadas con operaciones de usuarios.
 */
export default router;

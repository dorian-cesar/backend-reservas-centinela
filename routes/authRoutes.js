import express from "express";
import { register, login } from "../controllers/authController.js";

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Endpoints para autenticación de usuarios
 */

const router = express.Router();

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Registra un nuevo usuario
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: Nombre de usuario
 *               password:
 *                 type: string
 *                 description: Contraseña del usuario
 *             required:
 *               - username
 *               - password
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *       400:
 *         description: Datos inválidos o usuario ya existe
 *       500:
 *         description: Error interno del servidor
 */
/**
 * Ruta para registrar un nuevo usuario.
 * @name POST /register
 * @function
 * @memberof module:routes/auth
 * @param {express.Request} req - Objeto de solicitud HTTP
 * @param {express.Response} res - Objeto de respuesta HTTP
 */
router.post("/register", register);

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Inicia sesión de usuario
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: Nombre de usuario
 *               password:
 *                 type: string
 *                 description: Contraseña del usuario
 *             required:
 *               - username
 *               - password
 *     responses:
 *       200:
 *         description: Inicio de sesión exitoso
 *       400:
 *         description: Credenciales inválidas
 *       500:
 *         description: Error interno del servidor
 */
/**
 * Ruta para iniciar sesión de usuario.
 * @name POST /login
 * @function
 * @memberof module:routes/auth
 * @param {express.Request} req - Objeto de solicitud HTTP
 * @param {express.Response} res - Objeto de respuesta HTTP
 */
router.post("/login", login);

/**
 * Exporta el router de autenticación.
 * @module routes/auth
 */
export default router;

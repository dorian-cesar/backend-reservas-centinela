import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Registra un nuevo usuario.
 *     tags:
 *       - Autenticación
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: Usuario registrado exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Usuario registrado
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Error en el registro del usuario.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
/**
 * Registra un nuevo usuario en la base de datos.
 *
 * @async
 * @function register
 * @param {import('express').Request} req - Objeto de solicitud de Express, debe contener los datos del usuario en el cuerpo.
 * @param {import('express').Response} res - Objeto de respuesta de Express.
 * @returns {Promise<void>} Retorna una respuesta JSON con el usuario registrado o un mensaje de error.
 */
export const register = async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.json({ message: "Usuario registrado", user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Inicia sesión y obtiene un token JWT.
 *     tags:
 *       - Autenticación
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: usuario@correo.com
 *               password:
 *                 type: string
 *                 example: contraseña123
 *     responses:
 *       200:
 *         description: Inicio de sesión exitoso.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: Token JWT de autenticación.
 *                 user:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *       401:
 *         description: Credenciales inválidas.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Credenciales inválidas
 */
/**
 * Inicia sesión de usuario, valida credenciales y retorna un token JWT.
 *
 * @async
 * @function login
 * @param {import('express').Request} req - Objeto de solicitud de Express, debe contener email y password en el cuerpo.
 * @param {import('express').Response} res - Objeto de respuesta de Express.
 * @returns {Promise<void>} Retorna un token JWT y los datos del usuario si las credenciales son válidas, o un mensaje de error.
 */
export const login = async (req, res) => {
  const { email, password } = req.body;
  //const user = await User.findOne({ email });

  const usershow = await User.findOne({ email }).select("_id name email role");

  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.comparePassword(password)))
    return res.status(401).json({ message: "Credenciales inválidas" });

  const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
  );

  res.json({ token, user: usershow });
};
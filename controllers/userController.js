import User from "../models/User.js";

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Obtiene la lista de todos los usuarios
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
 *                 $ref: '#/models/User'
 */

/**
 * Obtiene todos los usuarios registrados en la base de datos.
 *
 * @async
 * @function getUsers
 * @param {import('express').Request} req - Objeto de solicitud HTTP.
 * @param {import('express').Response} res - Objeto de respuesta HTTP.
 * @returns {Promise<void>} Retorna una respuesta JSON con la lista de usuarios.
 */
export const getUsers = async (req, res) => {
  const users = await User.find();
  res.json(users);
};

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Elimina un usuario por su ID
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Usuario eliminado
 */

/**
 * Elimina un usuario de la base de datos por su identificador.
 *
 * @async
 * @function deleteUser
 * @param {import('express').Request} req - Objeto de solicitud HTTP.
 * @param {import('express').Response} res - Objeto de respuesta HTTP.
 * @returns {Promise<void>} Retorna una respuesta JSON confirmando la eliminación.
 */
export const deleteUser = async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: "Usuario eliminado" });
};

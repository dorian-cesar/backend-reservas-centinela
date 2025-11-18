import User from "../models/User.js";

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Obtiene la lista de todos los usuarios
 *     tags:
 *       - Usuarios
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
export const getUsers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
    const skip = (page - 1) * limit;

    // filtros
    const { q, role } = req.query;
    const query = {};

    if (q && q.trim() !== "") {
      // búsqueda por nombre, email o rut (case-insensitive, partial)
      const regex = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      query.$or = [{ name: regex }, { email: regex }, { rut: regex }];
    }

    if (role && role.trim() !== "") {
      query.role = role.trim();
    }

    // sorting
    const allowedSortFields = ["createdAt", "name", "email", "_id"];
    const sortBy = allowedSortFields.includes(req.query.sortBy) ? req.query.sortBy : "_id";
    const order = (req.query.order || "asc").toLowerCase() === "desc" ? -1 : 1;
    const sortObj = { [sortBy]: order };

    // consulta paginada con exclusión del password
    const [users, total] = await Promise.all([
      User.find(query)
        .select("-password")
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query)
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    res.json({
      success: true,
      data: users,
      pagination: {
        total,
        totalPages,
        page,
        limit
      }
    });
  } catch (err) {
    console.error("getUsers error:", err);
    res.status(500).json({ success: false, message: "Error del servidor" });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, rut, password } = req.body;

    // validar existencia
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: "Usuario no encontrado" });

    // si viene email y es distinto, comprobar colisión
    if (email && email !== user.email) {
      const exists = await User.findOne({ email });
      if (exists) {
        return res.status(400).json({ success: false, message: "El correo ya está en uso por otro usuario" });
      }
    }

    // construir update object
    const update = {};
    if (name !== undefined) update.name = name;
    if (email !== undefined) update.email = email;
    if (role !== undefined) update.role = role;
    if (rut !== undefined) update.rut = rut;

    // si viene password, hashearlo (pre('save') no corre en findByIdAndUpdate)
    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      update.password = hashed;
    }

    // actualizar y devolver sin password
    const updated = await User.findByIdAndUpdate(id, update, { new: true, runValidators: true })
      .select("-password")
      .lean();

    res.json({ success: true, data: updated });
  } catch (err) {
    console.error("updateUser error:", err);
    // manejo básico de errores: si mongoose tira ValidationError
    if (err.name === "ValidationError") {
      return res.status(400).json({ success: false, message: err.message });
    }
    res.status(500).json({ success: false, message: "Error del servidor" });
  }
};

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Elimina un usuario por su ID
 *     tags:
 *       - Usuarios
 *     security:
 *       - bearerAuth: []
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
 *       404:
 *         description: Usuario no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Usuario no encontrado
 */
export const deleteUser = async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) {
    return res.status(404).json({ error: "Usuario no encontrado" });
  }
  res.json({ message: "Usuario eliminado" });
};
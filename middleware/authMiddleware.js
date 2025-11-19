import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export const protect = (...allowedRoles) => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    console.error("JWT_SECRET no definido");
    throw new Error("JWT secret no configurado");
  }

  return (req, res, next) => {
    try {
      let token = req.headers.authorization;

      if (!token) {
        return res.status(401).json({ message: "Token no proporcionado" });
      }

      token = token.replace("Bearer ", "").trim();

      if (!token) {
        return res.status(401).json({ message: "Token vacío" });
      }

      const payload = jwt.verify(token, secret);

      req.user = {
        id: payload.id,
        role: payload.role
      };

      // Solo validar roles si hay roles permitidos
      if (allowedRoles.length > 0) {
        const normalizedRoles = allowedRoles
          .filter(r => typeof r === "string")
          .map(r => r.toLowerCase());

        const userRole = String(req.user.role).toLowerCase();

        if (!normalizedRoles.includes(userRole)) {
          return res.status(403).json({
            message: "No tienes permisos para esta acción"
          });
        }
      }

      next();

    } catch (err) {
      console.error("Middleware auth error:", err.message);

      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Token expirado" });
      }
      if (err.name === "JsonWebTokenError") {
        return res.status(401).json({ message: "Token inválido" });
      }

      return res.status(401).json({ message: "Error de autenticación" });
    }
  };
};

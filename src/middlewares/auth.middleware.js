import { verifyToken } from "../helpers/jwt.helper.js";
import { UserModel } from "../models/user.model.js";

// Middleware para verificar la autenticación mediante JWT almacenado en cookies
export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        message: "Acceso denegado. Token de autenticación no proporcionado",
      });
    }

    // Verificar y decodificar el token JWT
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (tokenError) {
      return res.status(401).json({
        message: "Token inválido o expirado",
      });
    }

    // Buscar al usuario activo en la base de datos
    const user = await UserModel.findOne({
      _id: decoded.id || decoded._id,
      deletedAt: null,
    });

    if (!user) {
      return res.status(401).json({
        message: "Usuario no encontrado o deshabilitado en el sistema",
      });
    }

    // Adjuntar el usuario al objeto req
    req.user = user;
    next();
  } catch (error) {
    console.error("Error en authMiddleware:", error);
    return res.status(500).json({
      message: "Error interno del servidor durante la autenticación",
    });
  }
};

// Middleware para verificar que el usuario autenticado posea rol de administrador
export const adminMiddleware = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "No autenticado. Debe iniciar sesión primero",
      });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Acceso denegado. Se requieren permisos de administrador",
      });
    }

    next();
  } catch (error) {
    console.error("Error en adminMiddleware:", error);
    return res.status(500).json({
      message: "Error interno del servidor en la autorización",
    });
  }
};

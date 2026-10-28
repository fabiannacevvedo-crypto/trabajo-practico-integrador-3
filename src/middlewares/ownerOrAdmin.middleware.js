import { isValidObjectId } from "mongoose";
import { EventModel } from "../models/event.model.js";

// Middleware para verificar que el usuario sea el organizador del evento o administrador
export const ownerOrAdminMiddleware = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        message: "El ID proporcionado no es un ObjectId válido de MongoDB",
      });
    }

    const event = await EventModel.findById(id);

    if (!event) {
      return res.status(404).json({
        message: "Evento no encontrado",
      });
    }

    // Permitir acceso si el usuario es administrador o si es el organizador del evento
    const isOwner = event.organizer.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        message: "Acceso denegado. Solo el organizador del evento o un administrador pueden realizar esta acción",
      });
    }

    // Guardar el evento en la request para evitar consultas redundantes
    req.event = event;
    next();
  } catch (error) {
    console.error("Error en ownerOrAdminMiddleware:", error);
    return res.status(500).json({
      message: "Error interno del servidor en la verificación de permisos del evento",
    });
  }
};

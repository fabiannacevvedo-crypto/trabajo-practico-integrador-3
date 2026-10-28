import { Router } from "express";
import {
  createEvent,
  getAllEvents,
  getMyEvents,
  getEventById,
  updateEvent,
  deleteEvent,
} from "../controllers/event.controller.js";
import {
  createEventValidator,
  updateEventValidator,
} from "../middlewares/event.validator.js";
import { validateMongoIdParam } from "../middlewares/validator.middleware.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { ownerOrAdminMiddleware } from "../middlewares/ownerOrAdmin.middleware.js";

export const eventRouter = Router();

// Todas las rutas de eventos requieren usuario autenticado
eventRouter.use(authMiddleware);

// Rutas generales para usuarios autenticados
eventRouter.post("/", createEventValidator, createEvent);
eventRouter.get("/", getAllEvents);

// Ruta específica para los eventos del usuario autenticado (debe ir antes de /:id)
eventRouter.get("/my", getMyEvents);

// Ruta para obtener un evento por ID
eventRouter.get("/:id", validateMongoIdParam("id"), getEventById);

// Rutas restringidas exclusivamente al organizador del evento o a un administrador
eventRouter.put("/:id", ownerOrAdminMiddleware, updateEventValidator, updateEvent);
eventRouter.delete(
  "/:id",
  ownerOrAdminMiddleware,
  validateMongoIdParam("id"),
  deleteEvent
);

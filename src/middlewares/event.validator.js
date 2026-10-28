import { body, param } from "express-validator";
import { EventModel } from "../models/event.model.js";
import { CategoryModel } from "../models/category.model.js";
import { validateResult } from "./validator.middleware.js";

// Validador para crear evento (POST /api/events)
export const createEventValidator = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("El título del evento es obligatorio")
    .isLength({ min: 3, max: 150 })
    .withMessage("El título debe tener entre 3 y 150 caracteres")
    .custom(async (value) => {
      const existing = await EventModel.findOne({ title: value });
      if (existing) {
        throw new Error("Ya existe un evento con ese título");
      }
      return true;
    }),

  body("description")
    .trim()
    .notEmpty()
    .withMessage("La descripción del evento es obligatoria")
    .isLength({ min: 20 })
    .withMessage("La descripción debe tener un mínimo de 20 caracteres"),

  body("startDate")
    .notEmpty()
    .withMessage("La fecha de inicio es obligatoria")
    .isISO8601()
    .withMessage("La fecha de inicio debe tener formato de fecha válido (ISO 8601)")
    .toDate(),

  body("endDate")
    .notEmpty()
    .withMessage("La fecha de finalización es obligatoria")
    .isISO8601()
    .withMessage("La fecha de finalización debe tener formato de fecha válido (ISO 8601)")
    .toDate()
    .custom((value, { req }) => {
      if (req.body.startDate && new Date(value) <= new Date(req.body.startDate)) {
        throw new Error("La fecha de finalización (endDate) debe ser posterior a la fecha de inicio (startDate)");
      }
      return true;
    }),

  body("capacity")
    .notEmpty()
    .withMessage("La capacidad es obligatoria")
    .isInt({ min: 1 })
    .withMessage("La capacidad debe ser un número entero mayor o igual a 1")
    .toInt(),

  body("price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("El precio debe ser un número mayor o igual a 0")
    .toFloat(),

  body("status")
    .optional()
    .isIn(["scheduled", "cancelled", "finished"])
    .withMessage("El estado debe ser 'scheduled', 'cancelled' o 'finished'"),

  body("location")
    .notEmpty()
    .withMessage("La ubicación embebida es obligatoria")
    .isObject()
    .withMessage("La ubicación debe ser un objeto"),

  body("location.venue")
    .trim()
    .notEmpty()
    .withMessage("El lugar (venue) es obligatorio")
    .isLength({ min: 3, max: 100 })
    .withMessage("El lugar debe tener entre 3 y 100 caracteres"),

  body("location.address")
    .trim()
    .notEmpty()
    .withMessage("La dirección es obligatoria")
    .isLength({ min: 5, max: 150 })
    .withMessage("La dirección debe tener entre 5 y 150 caracteres"),

  body("location.city")
    .trim()
    .notEmpty()
    .withMessage("La ciudad es obligatoria")
    .isLength({ min: 2, max: 50 })
    .withMessage("La ciudad debe tener entre 2 y 50 caracteres"),

  body("categories")
    .optional()
    .isArray()
    .withMessage("Las categorías deben enviarse como un arreglo de IDs"),

  body("categories.*")
    .optional()
    .isMongoId()
    .withMessage("Cada elemento del arreglo categories debe ser un ObjectId válido"),

  body("categories").custom(async (categories) => {
    if (categories && Array.isArray(categories) && categories.length > 0) {
      // Eliminar duplicados para chequear existencia
      const uniqueCategories = [...new Set(categories)];
      const foundCount = await CategoryModel.countDocuments({
        _id: { $in: uniqueCategories },
      });
      if (foundCount !== uniqueCategories.length) {
        throw new Error("Una o más categorías enviadas en 'categories' no existen en la base de datos");
      }
    }
    return true;
  }),

  validateResult,
];

// Validador para actualizar evento (PUT /api/events/:id)
export const updateEventValidator = [
  param("id")
    .isMongoId()
    .withMessage("El parámetro 'id' debe ser un ObjectId válido de MongoDB"),

  body("title")
    .optional()
    .trim()
    .isLength({ min: 3, max: 150 })
    .withMessage("El título debe tener entre 3 y 150 caracteres")
    .custom(async (value, { req }) => {
      const existing = await EventModel.findOne({
        title: value,
        _id: { $ne: req.params.id },
      });
      if (existing) {
        throw new Error("Ya existe otro evento con ese título");
      }
      return true;
    }),

  body("description")
    .optional()
    .trim()
    .isLength({ min: 20 })
    .withMessage("La descripción debe tener un mínimo de 20 caracteres"),

  body("startDate")
    .optional()
    .isISO8601()
    .withMessage("La fecha de inicio debe tener formato válido (ISO 8601)")
    .toDate(),

  body("endDate")
    .optional()
    .isISO8601()
    .withMessage("La fecha de finalización debe tener formato válido (ISO 8601)")
    .toDate()
    .custom(async (value, { req }) => {
      let start = req.body.startDate;
      if (!start) {
        const currentEvent = await EventModel.findById(req.params.id);
        if (currentEvent) {
          start = currentEvent.startDate;
        }
      }
      if (start && new Date(value) <= new Date(start)) {
        throw new Error("La fecha de finalización (endDate) debe ser posterior a la fecha de inicio (startDate)");
      }
      return true;
    }),

  body("capacity")
    .optional()
    .isInt({ min: 1 })
    .withMessage("La capacidad debe ser un número entero mayor o igual a 1")
    .toInt(),

  body("price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("El precio debe ser un número mayor o igual a 0")
    .toFloat(),

  body("status")
    .optional()
    .isIn(["scheduled", "cancelled", "finished"])
    .withMessage("El estado debe ser 'scheduled', 'cancelled' o 'finished'"),

  body("location")
    .optional()
    .isObject()
    .withMessage("La ubicación debe ser un objeto"),

  body("location.venue")
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("El lugar debe tener entre 3 y 100 caracteres"),

  body("location.address")
    .optional()
    .trim()
    .isLength({ min: 5, max: 150 })
    .withMessage("La dirección debe tener entre 5 y 150 caracteres"),

  body("location.city")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("La ciudad debe tener entre 2 y 50 caracteres"),

  body("categories")
    .optional()
    .isArray()
    .withMessage("Las categorías deben enviarse como un arreglo de IDs"),

  body("categories.*")
    .optional()
    .isMongoId()
    .withMessage("Cada elemento del arreglo categories debe ser un ObjectId válido"),

  body("categories").custom(async (categories) => {
    if (categories && Array.isArray(categories) && categories.length > 0) {
      const uniqueCategories = [...new Set(categories)];
      const foundCount = await CategoryModel.countDocuments({
        _id: { $in: uniqueCategories },
      });
      if (foundCount !== uniqueCategories.length) {
        throw new Error("Una o más categorías enviadas en 'categories' no existen en la base de datos");
      }
    }
    return true;
  }),

  validateResult,
];

import { body, param } from "express-validator";
import { CategoryModel } from "../models/category.model.js";
import { validateResult } from "./validator.middleware.js";

// Validador para crear categoría (POST /api/categories)
export const createCategoryValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("El nombre de la categoría es obligatorio")
    .isLength({ min: 2, max: 30 })
    .withMessage("El nombre debe tener entre 2 y 30 caracteres")
    .custom(async (value) => {
      const existing = await CategoryModel.findOne({ name: value });
      if (existing) {
        throw new Error("Ya existe una categoría con ese nombre");
      }
      return true;
    }),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("La descripción no puede superar los 200 caracteres"),

  validateResult,
];

// Validador para actualizar categoría (PUT /api/categories/:id)
export const updateCategoryValidator = [
  param("id")
    .isMongoId()
    .withMessage("El parámetro 'id' debe ser un ObjectId válido de MongoDB"),

  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage("El nombre debe tener entre 2 y 30 caracteres")
    .custom(async (value, { req }) => {
      const existing = await CategoryModel.findOne({
        name: value,
        _id: { $ne: req.params.id },
      });
      if (existing) {
        throw new Error("Ya existe otra categoría con ese nombre");
      }
      return true;
    }),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("La descripción no puede superar los 200 caracteres"),

  validateResult,
];

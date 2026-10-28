import { Router } from "express";
import {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller.js";
import {
  createCategoryValidator,
  updateCategoryValidator,
} from "../middlewares/category.validator.js";
import { validateMongoIdParam } from "../middlewares/validator.middleware.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { adminMiddleware } from "../middlewares/admin.middleware.js";

export const categoryRouter = Router();

// Todas las rutas de categorías requieren usuario autenticado
categoryRouter.use(authMiddleware);

// Rutas accesibles por cualquier usuario autenticado
categoryRouter.get("/", getAllCategories);
categoryRouter.get("/:id", validateMongoIdParam("id"), getCategoryById);

// Rutas restringidas exclusivamente para administradores
categoryRouter.post("/", adminMiddleware, createCategoryValidator, createCategory);
categoryRouter.put("/:id", adminMiddleware, updateCategoryValidator, updateCategory);
categoryRouter.delete("/:id", adminMiddleware, validateMongoIdParam("id"), deleteCategory);

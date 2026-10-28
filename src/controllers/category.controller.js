import { matchedData } from "express-validator";
import { CategoryModel } from "../models/category.model.js";
import { EventModel } from "../models/event.model.js";

// POST /api/categories - Crear una categoría (Solo Administrador)
export const createCategory = async (req, res) => {
  try {
    const data = matchedData(req);
    const newCategory = await CategoryModel.create(data);

    return res.status(201).json({
      message: "Categoría creada exitosamente",
      category: newCategory,
    });
  } catch (error) {
    console.error("Error en createCategory:", error);
    return res.status(500).json({
      message: "Error interno del servidor al crear la categoría",
    });
  }
};

// GET /api/categories - Listar todas las categorías (Usuario autenticado)
export const getAllCategories = async (req, res) => {
  try {
    const categories = await CategoryModel.find();

    return res.status(200).json({
      message: "Categorías obtenidas correctamente",
      count: categories.length,
      categories,
    });
  } catch (error) {
    console.error("Error en getAllCategories:", error);
    return res.status(500).json({
      message: "Error interno del servidor al obtener las categorías",
    });
  }
};

// GET /api/categories/:id - Obtener una categoría con su virtual populate 'events' (Usuario autenticado)
export const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await CategoryModel.findById(id).populate({
      path: "events",
      select: "title description startDate endDate capacity price status location",
    });

    if (!category) {
      return res.status(404).json({
        message: "Categoría no encontrada",
      });
    }

    return res.status(200).json({
      message: "Categoría obtenida correctamente",
      category,
    });
  } catch (error) {
    console.error("Error en getCategoryById:", error);
    return res.status(500).json({
      message: "Error interno del servidor al obtener la categoría",
    });
  }
};

// PUT /api/categories/:id - Actualizar una categoría (Solo Administrador)
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const data = matchedData(req, { locations: ["body"] });

    // Verificar existencia previa
    const existingCategory = await CategoryModel.findById(id);
    if (!existingCategory) {
      return res.status(404).json({
        message: "Categoría no encontrada para actualizar",
      });
    }

    const updatedCategory = await CategoryModel.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({
      message: "Categoría actualizada correctamente",
      category: updatedCategory,
    });
  } catch (error) {
    console.error("Error en updateCategory:", error);
    return res.status(500).json({
      message: "Error interno del servidor al actualizar la categoría",
    });
  }
};

// DELETE /api/categories/:id - Eliminar una categoría con eliminación en cascada (Solo Administrador)
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificación de existencia previa
    const category = await CategoryModel.findById(id);
    if (!category) {
      return res.status(404).json({
        message: "Categoría no encontrada para eliminar",
      });
    }

    // Eliminación en cascada: quitar la referencia de esta categoría en todos los eventos
    await EventModel.updateMany(
      { categories: id },
      { $pull: { categories: id } }
    );

    // Eliminar la categoría
    await CategoryModel.findByIdAndDelete(id);

    return res.status(200).json({
      message: "Categoría eliminada exitosamente y desvinculada de todos los eventos asociados (eliminación en cascada)",
    });
  } catch (error) {
    console.error("Error en deleteCategory:", error);
    return res.status(500).json({
      message: "Error interno del servidor al eliminar la categoría",
    });
  }
};

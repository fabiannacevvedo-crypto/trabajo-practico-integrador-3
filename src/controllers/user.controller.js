import { matchedData } from "express-validator";
import { UserModel } from "../models/user.model.js";
import { EventModel } from "../models/event.model.js";

// GET /api/users - Listar los usuarios activos con virtual populate de sus eventos (Solo Administrador)
export const getAllUsers = async (req, res) => {
  try {
    const users = await UserModel.find({ deletedAt: null }).populate({
      path: "events",
      select: "title description startDate endDate capacity price status location",
    });

    return res.status(200).json({
      message: "Usuarios activos obtenidos exitosamente",
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Error en getAllUsers:", error);
    return res.status(500).json({
      message: "Error interno del servidor al obtener los usuarios",
    });
  }
};

// GET /api/users/:id - Obtener un usuario activo con sus eventos (Solo Administrador)
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await UserModel.findOne({ _id: id, deletedAt: null }).populate({
      path: "events",
      select: "title description startDate endDate capacity price status location",
    });

    if (!user) {
      return res.status(404).json({
        message: "Usuario no encontrado o dado de baja",
      });
    }

    return res.status(200).json({
      message: "Usuario obtenido exitosamente",
      user,
    });
  } catch (error) {
    console.error("Error en getUserById:", error);
    return res.status(500).json({
      message: "Error interno del servidor al obtener el usuario",
    });
  }
};

// PUT /api/users/:id - Actualizar un usuario (Solo Administrador)
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const data = matchedData(req, { locations: ["body"] });

    // Verificación de existencia previa antes de editar
    const user = await UserModel.findOne({ _id: id, deletedAt: null });
    if (!user) {
      return res.status(404).json({
        message: "Usuario no encontrado para actualizar",
      });
    }

    if (data.username) user.username = data.username;
    if (data.email) user.email = data.email;
    if (data.role) user.role = data.role;
    if (data.profile) {
      if (data.profile.firstName) user.profile.firstName = data.profile.firstName;
      if (data.profile.lastName) user.profile.lastName = data.profile.lastName;
      if (data.profile.birthDate !== undefined) user.profile.birthDate = data.profile.birthDate;
      if (data.profile.phone !== undefined) user.profile.phone = data.profile.phone;
    }

    await user.save();

    return res.status(200).json({
      message: "Usuario actualizado correctamente",
      user,
    });
  } catch (error) {
    console.error("Error en updateUser:", error);
    return res.status(500).json({
      message: "Error interno del servidor al actualizar el usuario",
    });
  }
};

// DELETE /api/users/:id - Eliminación lógica del usuario con eliminación en cascada de sus eventos (Solo Administrador)
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificación de existencia previa antes de eliminar
    const user = await UserModel.findOne({ _id: id, deletedAt: null });
    if (!user) {
      return res.status(404).json({
        message: "Usuario no encontrado o ya eliminado previamente",
      });
    }

    // Eliminación lógica (Soft Delete) marcando deletedAt con la fecha actual
    user.deletedAt = new Date();
    await user.save();

    // Eliminación en cascada: eliminar todos los eventos organizados por este usuario
    const deletedEventsResult = await EventModel.deleteMany({ organizer: id });

    return res.status(200).json({
      message: "Usuario eliminado lógicamente y sus eventos asociados eliminados en cascada",
      deletedEventsCount: deletedEventsResult.deletedCount,
    });
  } catch (error) {
    console.error("Error en deleteUser:", error);
    return res.status(500).json({
      message: "Error interno del servidor al eliminar el usuario",
    });
  }
};

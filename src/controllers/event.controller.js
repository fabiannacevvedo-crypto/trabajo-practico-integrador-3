import { matchedData } from "express-validator";
import { EventModel } from "../models/event.model.js";

// POST /api/events - Crear un evento con sus categorías (el organizador es el usuario autenticado)
export const createEvent = async (req, res) => {
  try {
    const data = matchedData(req);

    // Asignar automáticamente como organizador al usuario logueado
    data.organizer = req.user._id;

    const newEvent = await EventModel.create(data);

    // Poblar organizador y categorías para responder con la información completa
    const populatedEvent = await EventModel.findById(newEvent._id)
      .populate("organizer", "username email profile role")
      .populate("categories", "name description");

    return res.status(201).json({
      message: "Evento creado exitosamente",
      event: populatedEvent,
    });
  } catch (error) {
    console.error("Error en createEvent:", error);
    return res.status(500).json({
      message: "Error interno del servidor al crear el evento",
    });
  }
};

// GET /api/events - Listar todos los eventos con populate de organizer y categories
export const getAllEvents = async (req, res) => {
  try {
    const events = await EventModel.find()
      .populate("organizer", "username email profile role")
      .populate("categories", "name description");

    return res.status(200).json({
      message: "Eventos obtenidos exitosamente",
      count: events.length,
      events,
    });
  } catch (error) {
    console.error("Error en getAllEvents:", error);
    return res.status(500).json({
      message: "Error interno del servidor al obtener los eventos",
    });
  }
};

// GET /api/events/my - Listar los eventos creados por el usuario logueado
export const getMyEvents = async (req, res) => {
  try {
    const events = await EventModel.find({ organizer: req.user._id })
      .populate("organizer", "username email profile role")
      .populate("categories", "name description");

    return res.status(200).json({
      message: "Eventos organizados por el usuario obtenidos exitosamente",
      count: events.length,
      events,
    });
  } catch (error) {
    console.error("Error en getMyEvents:", error);
    return res.status(500).json({
      message: "Error interno del servidor al obtener los eventos del usuario",
    });
  }
};

// GET /api/events/:id - Obtener un evento por ID con populate de organizer y categories
export const getEventById = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await EventModel.findById(id)
      .populate("organizer", "username email profile role")
      .populate("categories", "name description");

    if (!event) {
      return res.status(404).json({
        message: "Evento no encontrado",
      });
    }

    return res.status(200).json({
      message: "Evento obtenido correctamente",
      event,
    });
  } catch (error) {
    console.error("Error en getEventById:", error);
    return res.status(500).json({
      message: "Error interno del servidor al obtener el evento",
    });
  }
};

// PUT /api/events/:id - Actualizar un evento y sus categorías (Solo organizador o admin)
export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const data = matchedData(req, { locations: ["body"] });

    const updatedEvent = await EventModel.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    })
      .populate("organizer", "username email profile role")
      .populate("categories", "name description");

    return res.status(200).json({
      message: "Evento actualizado correctamente",
      event: updatedEvent,
    });
  } catch (error) {
    console.error("Error en updateEvent:", error);
    return res.status(500).json({
      message: "Error interno del servidor al actualizar el evento",
    });
  }
};

// DELETE /api/events/:id - Eliminación física de un evento (Solo organizador o admin)
export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    await EventModel.findByIdAndDelete(id);

    return res.status(200).json({
      message: "Evento eliminado físicamente con éxito",
    });
  } catch (error) {
    console.error("Error en deleteEvent:", error);
    return res.status(500).json({
      message: "Error interno del servidor al eliminar el evento",
    });
  }
};

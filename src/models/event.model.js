import { Schema, model } from "mongoose";

// Subdocumento embebido para Ubicación (Relación 1:1 Embebida)
const locationSchema = new Schema(
  {
    venue: {
      type: String,
      required: [true, "El lugar (venue) es obligatorio"],
      trim: true,
      minlength: [3, "El lugar debe tener al menos 3 caracteres"],
      maxlength: [100, "El lugar no puede superar los 100 caracteres"],
    },
    address: {
      type: String,
      required: [true, "La dirección es obligatoria"],
      trim: true,
      minlength: [5, "La dirección debe tener al menos 5 caracteres"],
      maxlength: [150, "La dirección no puede superar los 150 caracteres"],
    },
    city: {
      type: String,
      required: [true, "La ciudad es obligatoria"],
      trim: true,
      minlength: [2, "La ciudad debe tener al menos 2 caracteres"],
      maxlength: [50, "La ciudad no puede superar los 50 caracteres"],
    },
  },
  { _id: false }
);

// Esquema de Evento
const eventSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "El título del evento es obligatorio"],
      unique: true,
      trim: true,
      minlength: [3, "El título debe tener al menos 3 caracteres"],
      maxlength: [150, "El título no puede superar los 150 caracteres"],
    },
    description: {
      type: String,
      required: [true, "La descripción del evento es obligatoria"],
      trim: true,
      minlength: [20, "La descripción debe tener al menos 20 caracteres"],
    },
    startDate: {
      type: Date,
      required: [true, "La fecha de inicio es obligatoria"],
    },
    endDate: {
      type: Date,
      required: [true, "La fecha de finalización es obligatoria"],
    },
    capacity: {
      type: Number,
      required: [true, "La capacidad es obligatoria"],
      min: [1, "La capacidad mínima debe ser 1"],
      validate: {
        validator: Number.isInteger,
        message: "La capacidad debe ser un número entero",
      },
    },
    price: {
      type: Number,
      min: [0, "El precio debe ser un número mayor o igual a 0"],
      default: 0,
    },
    status: {
      type: String,
      enum: {
        values: ["scheduled", "cancelled", "finished"],
        message: "El estado debe ser 'scheduled', 'cancelled' o 'finished'",
      },
      default: "scheduled",
    },
    // Documento embebido (1:1)
    location: {
      type: locationSchema,
      required: [true, "La ubicación del evento es obligatoria"],
    },
    // Relación referenciada 1:N: User -> Event (organizer)
    organizer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "El organizador del evento es obligatorio"],
    },
    // Relación referenciada N:M: Event <-> Category (array de ObjectIds)
    categories: [
      {
        type: Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

export const EventModel = model("Event", eventSchema);

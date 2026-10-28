import { Schema, model } from "mongoose";

// Subdocumento embebido para el Perfil (Relación 1:1 Embebida)
const profileSchema = new Schema(
  {
    firstName: {
      type: String,
      required: [true, "El nombre es obligatorio"],
      trim: true,
      minlength: [2, "El nombre debe tener al menos 2 caracteres"],
      maxlength: [50, "El nombre no puede superar los 50 caracteres"],
    },
    lastName: {
      type: String,
      required: [true, "El apellido es obligatorio"],
      trim: true,
      minlength: [2, "El apellido debe tener al menos 2 caracteres"],
      maxlength: [50, "El apellido no puede superar los 50 caracteres"],
    },
    birthDate: {
      type: Date,
      default: null,
    },
    phone: {
      type: String,
      trim: true,
      default: null,
    },
  },
  { _id: false }
);

// Esquema de Usuario
const userSchema = new Schema(
  {
    username: {
      type: String,
      required: [true, "El nombre de usuario es obligatorio"],
      unique: true,
      trim: true,
      minlength: [3, "El username debe tener al menos 3 caracteres"],
      maxlength: [20, "El username no puede superar los 20 caracteres"],
    },
    email: {
      type: String,
      required: [true, "El correo electrónico es obligatorio"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "La contraseña es obligatoria"],
    },
    role: {
      type: String,
      enum: {
        values: ["user", "admin"],
        message: "El rol debe ser 'user' o 'admin'",
      },
      default: "user",
    },
    // Documento embebido (1:1)
    profile: {
      type: profileSchema,
      required: [true, "El perfil del usuario es obligatorio"],
    },
    // Campo para eliminación lógica (soft delete)
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.password;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.password;
        return ret;
      },
    },
  }
);

// Middleware de consulta: Ignorar usuarios con deletedAt distinto de null en consultas normales
userSchema.pre(/^find/, function () {
  // Permite consultar explícitamente usuarios eliminados si se indica includeDeleted: true
  const filter = this.getFilter();
  if (!filter.includeDeleted && filter.deletedAt === undefined) {
    this.where({ deletedAt: null });
  }
});

// Virtual populate: eventos organizados por este usuario
userSchema.virtual("events", {
  ref: "Event",
  localField: "_id",
  foreignField: "organizer",
});

export const UserModel = model("User", userSchema);

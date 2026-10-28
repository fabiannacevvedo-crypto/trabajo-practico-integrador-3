import { body } from "express-validator";
import { UserModel } from "../models/user.model.js";
import { validateResult } from "./validator.middleware.js";

// Expresión regular para solo letras (incluye acentos y espacios)
const ONLY_LETTERS_REGEX = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
// Expresión regular para solo números entre 8 y 15 dígitos
const PHONE_REGEX = /^\d{8,15}$/;
// Expresión regular para contraseña: al menos una mayúscula, una minúscula y un número
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

// Validador para registro de usuario (POST /api/auth/register)
export const registerValidator = [
  body("username")
    .trim()
    .notEmpty()
    .withMessage("El nombre de usuario es obligatorio")
    .isLength({ min: 3, max: 20 })
    .withMessage("El nombre de usuario debe tener entre 3 y 20 caracteres")
    .isAlphanumeric()
    .withMessage("El nombre de usuario debe ser alfanumérico (solo letras y números)")
    .custom(async (value) => {
      const existingUser = await UserModel.findOne({ username: value, deletedAt: null });
      if (existingUser) {
        throw new Error("El nombre de usuario ya se encuentra registrado");
      }
      return true;
    }),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("El correo electrónico es obligatorio")
    .isEmail()
    .withMessage("Debe proporcionar un formato de correo electrónico válido")
    .normalizeEmail()
    .custom(async (value) => {
      const existingEmail = await UserModel.findOne({ email: value, deletedAt: null });
      if (existingEmail) {
        throw new Error("El correo electrónico ya se encuentra registrado");
      }
      return true;
    }),

  body("password")
    .notEmpty()
    .withMessage("La contraseña es obligatoria")
    .isLength({ min: 8 })
    .withMessage("La contraseña debe tener un mínimo de 8 caracteres")
    .matches(PASSWORD_REGEX)
    .withMessage("La contraseña debe contener al menos una letra mayúscula, una letra minúscula y un número"),

  body("role")
    .optional()
    .isIn(["user", "admin"])
    .withMessage("El rol debe ser 'user' o 'admin'"),

  body("profile")
    .notEmpty()
    .withMessage("El perfil embebido es obligatorio")
    .isObject()
    .withMessage("El perfil debe ser un objeto válido"),

  body("profile.firstName")
    .trim()
    .notEmpty()
    .withMessage("El nombre del perfil es obligatorio")
    .isLength({ min: 2, max: 50 })
    .withMessage("El nombre debe tener entre 2 y 50 caracteres")
    .matches(ONLY_LETTERS_REGEX)
    .withMessage("El nombre solo debe contener letras"),

  body("profile.lastName")
    .trim()
    .notEmpty()
    .withMessage("El apellido del perfil es obligatorio")
    .isLength({ min: 2, max: 50 })
    .withMessage("El apellido debe tener entre 2 y 50 caracteres")
    .matches(ONLY_LETTERS_REGEX)
    .withMessage("El apellido solo debe contener letras"),

  body("profile.birthDate")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("La fecha de nacimiento debe ser una fecha válida (formato ISO 8601)")
    .toDate()
    .custom((value) => {
      if (value && new Date(value) > new Date()) {
        throw new Error("La fecha de nacimiento no puede ser una fecha futura");
      }
      return true;
    }),

  body("profile.phone")
    .optional({ values: "falsy" })
    .matches(PHONE_REGEX)
    .withMessage("El teléfono debe contener únicamente números y tener entre 8 y 15 dígitos"),

  validateResult,
];

// Validador para inicio de sesión (POST /api/auth/login)
export const loginValidator = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("El correo electrónico es obligatorio")
    .isEmail()
    .withMessage("Debe proporcionar un formato de correo electrónico válido"),

  body("password")
    .notEmpty()
    .withMessage("La contraseña es obligatoria"),

  validateResult,
];

// Validador para actualizar perfil del usuario autenticado (PUT /api/auth/profile)
export const updateProfileValidator = [
  body("firstName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("El nombre debe tener entre 2 y 50 caracteres")
    .matches(ONLY_LETTERS_REGEX)
    .withMessage("El nombre solo debe contener letras"),

  body("lastName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("El apellido debe tener entre 2 y 50 caracteres")
    .matches(ONLY_LETTERS_REGEX)
    .withMessage("El apellido solo debe contener letras"),

  body("birthDate")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("La fecha de nacimiento debe tener un formato de fecha válido (ISO 8601)")
    .toDate()
    .custom((value) => {
      if (value && new Date(value) > new Date()) {
        throw new Error("La fecha de nacimiento no puede ser una fecha futura");
      }
      return true;
    }),

  body("phone")
    .optional({ values: "falsy" })
    .matches(PHONE_REGEX)
    .withMessage("El teléfono debe contener únicamente números y tener entre 8 y 15 dígitos"),

  validateResult,
];

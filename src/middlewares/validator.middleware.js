import { validationResult, param } from "express-validator";

// Middleware reutilizable para capturar y devolver errores de validación con código 400
export const validateResult = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Errores de validación",
      errors: errors.array(),
    });
  }
  next();
};

// Validador reutilizable para verificar que el parámetro :id sea un ObjectId válido de MongoDB
export const validateMongoIdParam = (paramName = "id") => [
  param(paramName)
    .isMongoId()
    .withMessage(`El parámetro '${paramName}' debe ser un ObjectId válido de MongoDB`),
  validateResult,
];

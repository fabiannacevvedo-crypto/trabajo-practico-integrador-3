import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { connectDB } from "./src/config/database.js";
import { apiRouter } from "./src/routes/index.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globales básicos exigidos por la consigna
app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ruta base de prueba de estado
app.get("/", (req, res) => {
  res.status(200).json({
    message: "API REST Trabajo Práctico Integrador Nº III - Gestión de Eventos",
    status: "online",
  });
});

// Rutas de la API (/api/auth, /api/users, /api/events, /api/categories)
app.use("/api", apiRouter);

// Manejo de rutas inexistentes (404 Not Found)
app.use((req, res) => {
  res.status(404).json({
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  });
});

// Manejador global de errores inesperados (500 Internal Server Error)
app.use((err, req, res, next) => {
  console.error("Error no controlado:", err);
  res.status(500).json({
    message: "Error interno del servidor",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Inicialización de la base de datos y puesta en marcha del servidor
export const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Servidor Express ejecutándose en el puerto ${PORT}`);
  });
};

// Ejecución directa
startServer();

export default app;

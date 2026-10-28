import "dotenv/config";
import mongoose from "mongoose";
import { UserModel } from "./src/models/user.model.js";
import { CategoryModel } from "./src/models/category.model.js";
import { EventModel } from "./src/models/event.model.js";
import { hashPassword } from "./src/helpers/bcrypt.helper.js";

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/db_eventos_tpi3";
    await mongoose.connect(mongoUri);
    console.log("Conectado a MongoDB para sembrado de datos...");

    // Limpiar colecciones
    await UserModel.deleteMany({});
    await CategoryModel.deleteMany({});
    await EventModel.deleteMany({});
    console.log("Colecciones reiniciadas.");

    // 1. Crear usuarios
    const adminPassword = await hashPassword("Admin12345");
    const userPassword = await hashPassword("User12345");

    const admin = await UserModel.create({
      username: "adminfabian",
      email: "admin@politecnicoformosa.edu.ar",
      password: adminPassword,
      role: "admin",
      profile: {
        firstName: "Fabian",
        lastName: "Acevedo",
        birthDate: new Date("1994-08-15"),
        phone: "3704456789",
      },
    });

    const user = await UserModel.create({
      username: "cristianuser",
      email: "cristian@politecnicoformosa.edu.ar",
      password: userPassword,
      role: "user",
      profile: {
        firstName: "Cristian",
        lastName: "Acevedo",
        birthDate: new Date("1996-03-22"),
        phone: "3704112233",
      },
    });

    console.log("Usuarios creados exitosamente (admin y usuario regular).");

    // 2. Crear categorías
    const catTech = await CategoryModel.create({
      name: "Tecnología y Software",
      description: "Conferencias, talleres y hackathons de programación y desarrollo.",
    });

    const catDesign = await CategoryModel.create({
      name: "Diseño y UX",
      description: "Workshops de diseño de interfaces, experiencia de usuario y accesibilidad.",
    });

    const catAI = await CategoryModel.create({
      name: "Inteligencia Artificial",
      description: "Seminarios de Machine Learning, agentes inteligentes y ciencia de datos.",
    });

    console.log("Categorías creadas exitosamente.");

    // 3. Crear eventos
    await EventModel.create({
      title: "Congreso Internacional de Desarrollo de Software 2026",
      description: "Tres jornadas intensivas sobre arquitecturas modernas, microservicios, bases de datos NoSQL y cloud computing.",
      startDate: new Date("2026-11-15T09:00:00Z"),
      endDate: new Date("2026-11-17T18:00:00Z"),
      capacity: 300,
      price: 5000,
      status: "scheduled",
      location: {
        venue: "Polo Científico, Tecnológico y de Innovación",
        address: "Ruta Nacional Nº 11 Km 10",
        city: "Formosa",
      },
      organizer: user._id,
      categories: [catTech._id, catAI._id],
    });

    await EventModel.create({
      title: "Workshop de UX/UI y Accesibilidad Web",
      description: "Taller práctico para construir interfaces inclusivas, testeables y centradas en el usuario según pautas WCAG.",
      startDate: new Date("2026-12-01T14:00:00Z"),
      endDate: new Date("2026-12-01T20:00:00Z"),
      capacity: 50,
      price: 1500,
      status: "scheduled",
      location: {
        venue: "Instituto Politécnico Formosa - Aula Magna",
        address: "Av. Gutnisky 3200",
        city: "Formosa",
      },
      organizer: admin._id,
      categories: [catDesign._id],
    });

    console.log("Eventos de prueba creados exitosamente.");
    console.log("Sembrado finalizado con éxito.");
    process.exit(0);
  } catch (error) {
    console.error("Error durante el sembrado:", error);
    process.exit(1);
  }
};

seedDatabase();

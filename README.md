# Trabajo Práctico Integrador Nº III - API REST para Gestión de Eventos

**Instituto Politécnico Formosa**  
**Carrera:** Tecnicatura Superior en Desarrollo de Software  
**Cátedra:** Taller de Lenguajes de Programación II  
**Estudiante:** Cristian Fabián Acevedo  
**Docente:** Equipo de Cátedra  

---

## 📌 1. Descripción del Proyecto

Este proyecto consiste en el desarrollo integral de una **API RESTful modularizada** construida desde cero con **Node.js**, **Express**, **MongoDB** como base de datos NoSQL y **Mongoose** como ODM.

La API implementa un ecosistema completo para la gestión de usuarios, eventos y categorías, aplicando las mejores prácticas de la industria:
- **Autenticación y Autorización**: Tokens JWT almacenados en **cookies seguras con `httpOnly`**, hasheo de contraseñas con **bcrypt**, y control de acceso basado en roles (`user` vs `admin`) y propiedad de recursos (`ownerOrAdminMiddleware`).
- **Relaciones en Mongoose**:
  - **1:1 Embebidas**: `User ↔ Profile` y `Event ↔ Location`.
  - **1:N Referenciadas**: `User → Event` (campo `organizer`).
  - **N:M Referenciadas**: `Event ↔ Category` (array de ObjectIds en `categories`).
  - **Virtual Populate**: Colecciones que no guardan la referencia exponen campos virtuales (`User.events` y `Category.events`) con `{ virtuals: true }`.
- **Eliminaciones Avanzadas**:
  - **Eliminación Lógica (Soft Delete)**: En el modelo `User` mediante el campo `deletedAt: Date`. Un middleware de consulta Mongoose (`pre(/^find/)`) asegura que las consultas habituales ignoren usuarios dados de baja.
  - **Eliminación en Cascada**: Al eliminar lógicamente un usuario se eliminan todos sus eventos asociados; y al eliminar una categoría, se remueve automáticamente de todos los eventos que la referenciaban (`$pull`).
- **Validaciones Estrictas**: Doble capa con **express-validator** y validaciones de esquema de Mongoose, middleware reutilizable de errores (`validationResult` con código 400), sanitización con `matchedData()`, y validaciones personalizadas con `custom()`.
- **ESModules**: Uso exclusivo de sintaxis moderna `import` / `export`.

---

## 📁 2. Estructura del Proyecto

```text
trabajo-practico-integrador-3/
├── app.js                          # Servidor Express, middlewares globales y enrutador principal
├── package.json                    # Dependencias y scripts del proyecto (ESModules)
├── package-lock.json
├── .env.example                    # Plantilla de variables de entorno requeridas
├── .gitignore                      # Exclusión de node_modules, .env, etc.
├── README.md                       # Documentación exhaustiva del proyecto
├── test-e2e.js                     # Suite de pruebas automatizadas End-to-End (24/24 tests)
├── seed.js                         # Script de sembrado de datos iniciales
└── src/
    ├── config/
    │   └── database.js             # Conexión asíncrona a MongoDB con Mongoose
    ├── controllers/
    │   ├── auth.controller.js      # Registro, login, logout, perfil y edición de perfil
    │   ├── user.controller.js      # CRUD administrativo de usuarios y eliminación lógica/cascada
    │   ├── event.controller.js     # CRUD de eventos con populate y validación de permisos
    │   └── category.controller.js  # CRUD de categorías con virtual populate y cascada
    ├── helpers/
    │   ├── bcrypt.helper.js        # Hasheo y comparación segura de contraseñas
    │   └── jwt.helper.js           # Generación y verificación de tokens JWT
    ├── middlewares/
    │   ├── auth.middleware.js      # Verificación de JWT en cookies httpOnly
    │   ├── admin.middleware.js     # Restricción exclusiva para rol 'admin'
    │   ├── ownerOrAdmin.middleware.js # Control de permisos: organizador del evento o admin
    │   ├── validator.middleware.js # Middleware reutilizable para capturar errores 400
    │   ├── auth.validator.js       # Reglas de validación para registro, login y perfil
    │   ├── user.validator.js       # Reglas de validación para actualización de usuario
    │   ├── event.validator.js      # Reglas de validación para eventos (fechas, ubicación, etc.)
    │   └── category.validator.js   # Reglas de validación para categorías
    ├── models/
    │   ├── index.js                # Barril de exportación de modelos
    │   ├── user.model.js           # Esquema User con Profile embebido y virtual populate
    │   ├── event.model.js          # Esquema Event con Location embebida y referencias
    │   └── category.model.js       # Esquema Category con virtual populate
    └── routes/
        ├── index.js                # Enrutador central (/api)
        ├── auth.routes.js          # Endpoints /api/auth
        ├── user.routes.js          # Endpoints /api/users
        ├── event.routes.js         # Endpoints /api/events
        └── category.routes.js      # Endpoints /api/categories
```

---

## 🗄️ 3. Modelos y Relaciones de Base de Datos

Todos los esquemas de Mongoose incluyen `{ timestamps: true, versionKey: false }`.

### 1. User (Usuario)
- **Campos:**
  - `username`: String, obligatorio, único, 3-20 caracteres, alfanumérico.
  - `email`: String, obligatorio, único, formato email válido, en minúsculas.
  - `password`: String, obligatorio, hasheada con bcrypt (mínimo 8 caracteres, al menos 1 mayúscula, 1 minúscula y 1 número).
  - `role`: String, enum: `['user', 'admin']`, default: `'user'`.
  - `profile` (Documento Embebido 1:1):
    - `firstName`: String, 2-50 caracteres, solo letras.
    - `lastName`: String, 2-50 caracteres, solo letras.
    - `birthDate`: Date, opcional, fecha válida no futura.
    - `phone`: String, opcional, numérico entre 8 y 15 dígitos.
  - `deletedAt`: Date, default: `null` (soft delete).
- **Virtual Populate:**
  - `events`: Virtual hacia `Event` donde `foreignField: 'organizer'` y `localField: '_id'`.
- **Seguridad:**
  - La función transform de `toJSON` y `toObject` elimina automáticamente el campo `password` para evitar filtraciones.

### 2. Category (Categoría)
- **Campos:**
  - `name`: String, obligatorio, único, 2-30 caracteres.
  - `description`: String, opcional, máximo 200 caracteres.
- **Virtual Populate:**
  - `events`: Virtual hacia `Event` donde `foreignField: 'categories'` y `localField: '_id'`. Permite conocer todos los eventos que pertenecen a la categoría sin almacenar un array potencialmente masivo dentro de la categoría.

### 3. Event (Evento)
- **Campos:**
  - `title`: String, obligatorio, único, 3-150 caracteres.
  - `description`: String, obligatorio, mínimo 20 caracteres.
  - `startDate`: Date, obligatorio.
  - `endDate`: Date, obligatorio (validación custom: debe ser posterior a `startDate`).
  - `capacity`: Number, entero, mínimo 1.
  - `price`: Number, mínimo 0, default: 0.
  - `status`: String, enum: `['scheduled', 'cancelled', 'finished']`, default: `'scheduled'`.
  - `location` (Documento Embebido 1:1):
    - `venue`: String, obligatorio, 3-100 caracteres.
    - `address`: String, obligatorio, 5-150 caracteres.
    - `city`: String, obligatorio, 2-50 caracteres.
  - `organizer`: ObjectId referenciando a `User` (Relación 1:N obligatoria).
  - `categories`: Array de ObjectIds referenciando a `Category` (Relación N:M referenciada).

---

## 🔄 4. Eliminación Lógica y en Cascada

| Tipo | Modelo / Relación | Comportamiento Implementado |
|---|---|---|
| **Eliminación Lógica** | `User` | Al eliminar un usuario (`DELETE /api/users/:id`), se establece `deletedAt = new Date()`. El middleware `userSchema.pre(/^find/)` excluye automáticamente a estos usuarios de las consultas regulares. |
| **Eliminación en Cascada (1)** | `User` ➔ `Event` | Al eliminar lógicamente un usuario, se eliminan físicamente todos los eventos organizados por él (`EventModel.deleteMany({ organizer: id })`). |
| **Eliminación en Cascada (2)** | `Category` ➔ `Event` | Al eliminar físicamente una categoría (`DELETE /api/categories/:id`), se ejecuta un `$pull` en todos los eventos para remover su ID de la lista de categorías asociadas. |

---

## 🌐 5. Endpoints de la API

### Autenticación (`/api/auth`)
| Método | Endpoint | Acceso | Código Éxito | Descripción |
|---|---|---|---|---|
| `POST` | `/api/auth/register` | Público | `201 Created` | Registra usuario con perfil embebido y contraseña hasheada. |
| `POST` | `/api/auth/login` | Público | `200 OK` | Autentica usuario y emite cookie segura `token` con `httpOnly`. |
| `GET` | `/api/auth/profile` | Autenticado | `200 OK` | Retorna los datos del usuario autenticado actual. |
| `PUT` | `/api/auth/profile` | Autenticado | `200 OK` | Actualiza el perfil embebido (`profile`) del usuario autenticado. |
| `POST` | `/api/auth/logout` | Autenticado | `200 OK` | Invalida y limpia la cookie de autenticación. |

### Usuarios (`/api/users`)
| Método | Endpoint | Acceso | Código Éxito | Descripción |
|---|---|---|---|---|
| `GET` | `/api/users` | Solo Admin | `200 OK` | Lista usuarios activos con su virtual populate `events`. |
| `GET` | `/api/users/:id` | Solo Admin | `200 OK` | Detalle de usuario activo con sus eventos organizados. |
| `PUT` | `/api/users/:id` | Solo Admin | `200 OK` | Actualiza información o rol de un usuario. |
| `DELETE` | `/api/users/:id` | Solo Admin | `200 OK` | Eliminación lógica (`deletedAt`) y eliminación en cascada de sus eventos. |

### Categorías (`/api/categories`)
| Método | Endpoint | Acceso | Código Éxito | Descripción |
|---|---|---|---|---|
| `POST` | `/api/categories` | Solo Admin | `201 Created` | Crea una nueva categoría única. |
| `GET` | `/api/categories` | Autenticado | `200 OK` | Lista todas las categorías disponibles. |
| `GET` | `/api/categories/:id` | Autenticado | `200 OK` | Obtiene una categoría con su virtual populate `events`. |
| `PUT` | `/api/categories/:id` | Solo Admin | `200 OK` | Actualiza nombre y/o descripción de una categoría. |
| `DELETE` | `/api/categories/:id` | Solo Admin | `200 OK` | Elimina la categoría y la desvincula en cascada de todos los eventos. |

### Eventos (`/api/events`)
| Método | Endpoint | Acceso | Código Éxito | Descripción |
|---|---|---|---|---|
| `POST` | `/api/events` | Autenticado | `201 Created` | Crea un evento (el organizador es el usuario logueado). |
| `GET` | `/api/events` | Autenticado | `200 OK` | Lista todos los eventos con populate de `organizer` y `categories`. |
| `GET` | `/api/events/my` | Autenticado | `200 OK` | Lista los eventos organizados por el usuario logueado. |
| `GET` | `/api/events/:id` | Autenticado | `200 OK` | Detalle de un evento con populate completo. |
| `PUT` | `/api/events/:id` | Organizador / Admin | `200 OK` | Actualiza un evento (restringido a su creador o admin). |
| `DELETE` | `/api/events/:id` | Organizador / Admin | `200 OK` | Eliminación física del evento (restringido a su creador o admin). |

---

## 🚦 6. Códigos de Respuesta HTTP Utilizados

- `201 Created`: Creación exitosa de recursos (`register`, `createEvent`, `createCategory`).
- `200 OK`: Operaciones exitosas de lectura, actualización, eliminación y login.
- `400 Bad Request`: Errores de validación disparados por `express-validator` o IDs inválidos de MongoDB.
- `401 Unauthorized`: Peticiones a rutas privadas sin token o con token expirado/inválido.
- `403 Forbidden`: Intento de acceder a recursos sin los permisos necesarios (ej. no ser admin o no ser el organizador del evento).
- `404 Not Found`: Solicitud de un recurso inexistente o dado de baja lógica.
- `500 Internal Server Error`: Errores no controlados capturados en bloques `try/catch`.

---

## ⚙️ 7. Instalación y Configuración

### 1. Clonar el repositorio
```bash
git clone https://github.com/fabiannacevvedo-crypto/trabajo-practico-integrador-3.git
cd trabajo-practico-integrador-3
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Crear un archivo `.env` basado en `.env.example`:
```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/db_eventos_tpi3
JWT_SECRET=super_secreto_jwt_tpi3_clave_segura_2026
JWT_EXPIRES_IN=24h
```

### 4. Sembrado inicial de datos (Opcional)
Para cargar datos de prueba (usuarios admin y regular, categorías y eventos):
```bash
npm run seed
```

### 5. Iniciar la aplicación en modo desarrollo
```bash
npm run dev
```
O en producción:
```bash
npm start
```

---

## 🧪 8. Pruebas Automatizadas

El proyecto incluye una suite de pruebas End-to-End (`test-e2e.js`) que valida automáticamente **24 escenarios críticos**:
1. Conexión y estado de la API (`GET /`).
2. Registro de usuario regular y de administrador (`POST /api/auth/register`).
3. Login y emisión de cookies seguras con JWT (`POST /api/auth/login`).
4. Obtención y modificación de perfil embebido (`/api/auth/profile`).
5. Permisos de administrador en categorías (`POST /api/categories`).
6. Rechazo 403 Forbidden para usuarios sin rol `admin`.
7. Creación de eventos con subdocumento `location` y categorías N:M.
8. Verificación de `populate` de organizador y categorías en consultas de eventos.
9. Validación de rutas específicas como `GET /api/events/my`.
10. Comprobación de `Virtual Populate` en `Category` (`category.events`).
11. Comprobación de `Virtual Populate` en `User` (`user.events`).
12. Validación personalizada con `custom()`: rechazo de eventos con `endDate <= startDate` (400 Bad Request).
13. Edición de evento por su organizador (`PUT /api/events/:id`).
14. Eliminación en cascada de categoría: remoción automática del ID en el array `categories` del evento.
15. Eliminación lógica de usuario (`deletedAt`) e ignorado en consultas posteriores (404 Not Found).
16. Eliminación en cascada de usuario: borrado de todos los eventos que organizó.
17. Cierre de sesión y limpieza de cookie (`POST /api/auth/logout`).

Para ejecutar la suite de pruebas:
```bash
npm test
```

---

## 🌿 9. Control de Versiones (Git Flow)

Siguiendo estrictamente las consignas de entrega:
- **`main`**: Rama principal con el repositorio y README inicial.
- **`develop`**: Rama base de integración creada desde `main`.
- **`integrador-eventos`**: Rama de trabajo creada desde `develop`, en la cual se desarrollaron todos los módulos con más de 10 commits descriptivos en español siguiendo la convención Conventional Commits.
- **Merges limpios sin conflictos**: Integración realizada de `integrador-eventos` hacia `develop`, y posteriormente de `develop` hacia `main`.

---
*Desarrollado para el Instituto Politécnico Formosa - Taller de Lenguajes de Programación II.*

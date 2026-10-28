// Script de pruebas de integración End-to-End (E2E) para verificar todos los requerimientos del TPI 3
import "dotenv/config";

const BASE_URL = `http://127.0.0.1:${process.env.PORT || 3000}`;

const runTests = async () => {
  console.log("=== INICIANDO PRUEBAS AUTOMATIZADAS DEL TPI 3 ===\n");
  let passed = 0;
  let failed = 0;

  const assert = (condition, description) => {
    if (condition) {
      console.log(`✅ [OK] ${description}`);
      passed++;
    } else {
      console.error(`❌ [FALLÓ] ${description}`);
      failed++;
    }
  };

  try {
    // 1. Health Check
    const resHealth = await fetch(`${BASE_URL}/`);
    const dataHealth = await resHealth.json();
    assert(resHealth.status === 200 && dataHealth.status === "online", "1. Endpoint base GET / responde 200 OK");

    // 2. Registro de Usuario Regular
    const userPayload = {
      username: `user${Date.now() % 10000000}`,
      email: `user_${Date.now()}@correo.com`,
      password: "Password123",
      role: "user",
      profile: {
        firstName: "Carlos",
        lastName: "Gomez",
        birthDate: "1995-05-15",
        phone: "3704123456",
      },
    };

    const resRegUser = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userPayload),
    });
    const dataRegUser = await resRegUser.json();
    assert(resRegUser.status === 201 && dataRegUser.user.username === userPayload.username, "2. Registro de usuario regular POST /api/auth/register responde 201 Created");

    // 3. Registro de Usuario Administrador
    const adminPayload = {
      username: `admin${(Date.now() + 1) % 10000000}`,
      email: `admin_${Date.now()}@correo.com`,
      password: "AdminPassword123",
      role: "admin",
      profile: {
        firstName: "Fabian",
        lastName: "Acevedo",
        birthDate: "1990-10-20",
        phone: "3704987654",
      },
    };

    const resRegAdmin = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(adminPayload),
    });
    const dataRegAdmin = await resRegAdmin.json();
    assert(resRegAdmin.status === 201 && dataRegAdmin.user.role === "admin", "3. Registro de admin POST /api/auth/register responde 201 Created");

    // 4. Login Usuario Regular y captura de Cookie
    const resLoginUser = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: userPayload.email, password: userPayload.password }),
    });
    const userCookie = resLoginUser.headers.get("set-cookie");
    assert(resLoginUser.status === 200 && userCookie && userCookie.includes("token="), "4. Login usuario regular POST /api/auth/login responde 200 y envía cookie httpOnly");

    // 5. Login Administrador y captura de Cookie
    const resLoginAdmin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: adminPayload.email, password: adminPayload.password }),
    });
    const adminCookie = resLoginAdmin.headers.get("set-cookie");
    assert(resLoginAdmin.status === 200 && adminCookie && adminCookie.includes("token="), "5. Login admin POST /api/auth/login responde 200 y envía cookie httpOnly");

    // 6. Consultar Perfil Autenticado
    const resProfile = await fetch(`${BASE_URL}/api/auth/profile`, {
      headers: { Cookie: userCookie },
    });
    const dataProfile = await resProfile.json();
    assert(resProfile.status === 200 && dataProfile.user.email === userPayload.email, "6. Perfil usuario GET /api/auth/profile responde 200 OK");

    // 7. Actualizar Perfil Embebido
    const resUpdateProfile = await fetch(`${BASE_URL}/api/auth/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Cookie: userCookie },
      body: JSON.stringify({ firstName: "Carlos Alberto", phone: "3704999888" }),
    });
    const dataUpdateProfile = await resUpdateProfile.json();
    assert(resUpdateProfile.status === 200 && dataUpdateProfile.user.profile.firstName === "Carlos Alberto", "7. Actualizar perfil PUT /api/auth/profile responde 200 OK");

    // 8. Crear Categoría como Admin
    const categoryPayload = {
      name: `Tecnologia_${Date.now()}`.slice(0, 25),
      description: "Eventos dedicados al desarrollo de software y computación",
    };
    const resCreateCat = await fetch(`${BASE_URL}/api/categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify(categoryPayload),
    });
    const dataCreateCat = await resCreateCat.json();
    assert(resCreateCat.status === 201 && dataCreateCat.category._id, "8. Crear categoría POST /api/categories (Admin) responde 201 Created");
    const categoryId = dataCreateCat.category._id;

    // 9. Usuario regular intenta crear categoría (Debe dar 403 Forbidden)
    const resForbiddenCat = await fetch(`${BASE_URL}/api/categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: userCookie },
      body: JSON.stringify({ name: "Invalida", description: "No deberia crearse" }),
    });
    assert(resForbiddenCat.status === 403, "9. Usuario regular no autorizado para crear categoría responde 403 Forbidden");

    // 10. Listar categorías
    const resListCat = await fetch(`${BASE_URL}/api/categories`, {
      headers: { Cookie: userCookie },
    });
    const dataListCat = await resListCat.json();
    assert(resListCat.status === 200 && Array.isArray(dataListCat.categories), "10. Listar categorías GET /api/categories responde 200 OK");

    // 11. Crear Evento como Usuario Regular
    const eventPayload = {
      title: `Conferencia Devops ${Date.now()}`.slice(0, 100),
      description: "Un evento integral para desarrolladores de software con talleres practicos y networking.",
      startDate: new Date(Date.now() + 86400000).toISOString(),
      endDate: new Date(Date.now() + 172800000).toISOString(),
      capacity: 150,
      price: 2500,
      status: "scheduled",
      location: {
        venue: "Polo Cientifico y Tecnologico",
        address: "Ruta Nacional 11 Km 10",
        city: "Formosa",
      },
      categories: [categoryId],
    };

    const resCreateEvent = await fetch(`${BASE_URL}/api/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: userCookie },
      body: JSON.stringify(eventPayload),
    });
    const dataCreateEvent = await resCreateEvent.json();
    assert(resCreateEvent.status === 201 && dataCreateEvent.event._id, "11. Crear evento POST /api/events responde 201 Created con organizador y categorías asociadas");
    const eventId = dataCreateEvent.event._id;

    // 12. Listar eventos con populate
    const resListEvents = await fetch(`${BASE_URL}/api/events`, {
      headers: { Cookie: userCookie },
    });
    const dataListEvents = await resListEvents.json();
    const foundEvent = dataListEvents.events.find((e) => e._id === eventId);
    assert(
      resListEvents.status === 200 &&
      foundEvent &&
      foundEvent.organizer.username &&
      foundEvent.categories[0].name,
      "12. Listar eventos GET /api/events incluye populate de organizer y categories"
    );

    // 13. Listar mis eventos GET /api/events/my
    const resMyEvents = await fetch(`${BASE_URL}/api/events/my`, {
      headers: { Cookie: userCookie },
    });
    const dataMyEvents = await resMyEvents.json();
    assert(resMyEvents.status === 200 && dataMyEvents.events.length >= 1, "13. Listar mis eventos GET /api/events/my responde 200 OK");

    // 14. Obtener detalle de evento GET /api/events/:id
    const resGetEvent = await fetch(`${BASE_URL}/api/events/${eventId}`, {
      headers: { Cookie: userCookie },
    });
    const dataGetEvent = await resGetEvent.json();
    assert(resGetEvent.status === 200 && dataGetEvent.event.title === eventPayload.title, "14. Obtener evento por ID GET /api/events/:id responde 200 OK");

    // 15. Virtual populate en Categoría: eventos asociados
    const resCatVirtual = await fetch(`${BASE_URL}/api/categories/${categoryId}`, {
      headers: { Cookie: userCookie },
    });
    const dataCatVirtual = await resCatVirtual.json();
    assert(
      resCatVirtual.status === 200 &&
      Array.isArray(dataCatVirtual.category.events) &&
      dataCatVirtual.category.events.some((e) => e._id === eventId),
      "15. Virtual populate en Categoría (GET /api/categories/:id) incluye sus eventos asociados"
    );

    // 16. Virtual populate en Usuario: eventos organizados
    const resUserVirtual = await fetch(`${BASE_URL}/api/users/${dataRegUser.user._id}`, {
      headers: { Cookie: adminCookie },
    });
    const dataUserVirtual = await resUserVirtual.json();
    assert(
      resUserVirtual.status === 200 &&
      Array.isArray(dataUserVirtual.user.events) &&
      dataUserVirtual.user.events.some((e) => e._id === eventId),
      "16. Virtual populate en Usuario (GET /api/users/:id) incluye los eventos que organizó"
    );

    // 17. Validar fechas en Evento (endDate <= startDate debe fallar con 400 Bad Request)
    const resInvalidDates = await fetch(`${BASE_URL}/api/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: userCookie },
      body: JSON.stringify({
        ...eventPayload,
        title: "Evento con fecha invalida",
        startDate: "2026-11-10T10:00:00Z",
        endDate: "2026-11-09T10:00:00Z",
      }),
    });
    assert(resInvalidDates.status === 400, "17. Validación personalizada custom(): endDate anterior a startDate responde 400 Bad Request");

    // 18. Actualizar Evento por su Organizador
    const resUpdateEvent = await fetch(`${BASE_URL}/api/events/${eventId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Cookie: userCookie },
      body: JSON.stringify({ capacity: 200, price: 3000 }),
    });
    const dataUpdateEvent = await resUpdateEvent.json();
    assert(resUpdateEvent.status === 200 && dataUpdateEvent.event.capacity === 200, "18. Actualizar evento por organizador PUT /api/events/:id responde 200 OK");

    // 19. Eliminación en cascada de Categoría (al eliminar una categoría, se quita de todos los eventos)
    const resDelCat = await fetch(`${BASE_URL}/api/categories/${categoryId}`, {
      method: "DELETE",
      headers: { Cookie: adminCookie },
    });
    assert(resDelCat.status === 200, "19. Eliminación en cascada de categoría DELETE /api/categories/:id responde 200 OK");

    // Verificar que el evento ya no tenga esa categoría
    const resCheckEventAfterCatDel = await fetch(`${BASE_URL}/api/events/${eventId}`, {
      headers: { Cookie: userCookie },
    });
    const dataCheckEvent = await resCheckEventAfterCatDel.json();
    assert(
      dataCheckEvent.event.categories.length === 0,
      "20. Comprobación de cascada: la categoría fue removida del array categories del evento"
    );

    // 21. Eliminación lógica de Usuario (Soft delete) con eliminación en cascada de sus eventos
    const resDelUser = await fetch(`${BASE_URL}/api/users/${dataRegUser.user._id}`, {
      method: "DELETE",
      headers: { Cookie: adminCookie },
    });
    assert(resDelUser.status === 200, "21. Eliminación lógica de usuario DELETE /api/users/:id con cascada responde 200 OK");

    // Verificar que el usuario ya no aparezca en consultas normales
    const resCheckUserDeleted = await fetch(`${BASE_URL}/api/users/${dataRegUser.user._id}`, {
      headers: { Cookie: adminCookie },
    });
    assert(resCheckUserDeleted.status === 404, "22. Consultas normales ignoran al usuario con deletedAt (responde 404)");

    // Verificar que los eventos del usuario eliminado fueron eliminados en cascada
    const resCheckEventCascade = await fetch(`${BASE_URL}/api/events/${eventId}`, {
      headers: { Cookie: adminCookie },
    });
    assert(resCheckEventCascade.status === 404, "23. Cascada confirmada: los eventos organizados por el usuario fueron eliminados");

    // 24. Logout con usuario activo (adminCookie)
    const resLogout = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: "POST",
      headers: { Cookie: adminCookie },
    });
    const logoutCookie = resLogout.headers.get("set-cookie");
    assert(resLogout.status === 200 && logoutCookie && logoutCookie.includes("token=;"), "24. Logout POST /api/auth/logout limpia la cookie y responde 200 OK");

    console.log("\n==========================================");
    console.log(`TOTAL PRUEBAS: ${passed + failed}`);
    console.log(`PASARON: ${passed}`);
    console.log(`FALLARON: ${failed}`);
    console.log("==========================================");

    if (failed === 0) {
      console.log("\n🎉 ¡TODAS LAS PRUEBAS CUMPLIERON EXITOSAMENTE AL 100%! 🎉\n");
    }
  } catch (error) {
    console.error("Error durante las pruebas:", error);
  }
};

runTests();

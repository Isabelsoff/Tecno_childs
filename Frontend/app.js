// =============================================
// TecnoChilds - Lógica del Frontend (app.js)
// =============================================
// Este archivo maneja toda la interacción del usuario:
// navegación, registro, login, test vocacional y resultados.

// ---- Variables globales para el test ----
let preguntasTest = [];   // Arreglo con todas las preguntas del servidor
let preguntaActual = 0;   // Índice de la pregunta que se muestra actualmente
let respuestasUsuario = []; // Respuestas seleccionadas por el usuario

// ---- Variables para el sistema de cursos y quizzes ----
let perfilUsuario = null;
let moduloActual = null;
let preguntaQuizActual = 0;
let puntajeQuiz = 0;
let cursoSeleccionadoId = null;

// =============================================
// SISTEMA DE NOTIFICACIONES (Toast)
// =============================================
// En vez de usar alert() (que es feo y bloquea la pantalla),
// usamos "toasts": notificaciones elegantes que aparecen y desaparecen solas.

function mostrarToast(mensaje, tipo = "info") {
    const container = document.getElementById("toastContainer");
    const toast = document.createElement("div");
    toast.className = `toast toast-${tipo}`;

    // Ícono según el tipo de notificación (con clases CSS en vez de emojis)
    const iconos = { success: "✓", error: "✕", info: "i", warning: "!" };
    toast.innerHTML = `
        <span class="toast-icon toast-icon-${tipo}">${iconos[tipo] || "i"}</span>
        <span class="toast-msg">${mensaje}</span>
    `;

    container.appendChild(toast);

    // Activar la animación de entrada
    requestAnimationFrame(() => toast.classList.add("toast-visible"));

    // Remover después de 3.5 segundos con animación de salida
    setTimeout(() => {
        toast.classList.remove("toast-visible");
        toast.classList.add("toast-saliendo");
        setTimeout(() => toast.remove(), 400);
    }, 3500);
}

// =============================================
// MOSTRAR/OCULTAR CONTRASEÑA
// =============================================
// Cambia el tipo del input entre "password" y "text"
// para que el usuario pueda ver lo que escribió.

function togglePassword(inputId, boton) {
    const input = document.getElementById(inputId);
    if (input.type === "password") {
        input.type = "text";        // Mostrar contraseña
        boton.textContent = "⊘";   // Ojo cerrado
    } else {
        input.type = "password";    // Ocultar contraseña
        boton.textContent = "⊙";   // Ojo abierto
    }
}

// =============================================
// NAVEGACIÓN ENTRE SECCIONES
// =============================================
// Muestra una sección y oculta las demás.
// También actualiza los botones de navegación según si hay sesión activa.

function mostrar(seccion) {
    // Ocultar todas las secciones
    document.querySelectorAll(".seccion-pantalla").forEach(div => {
        div.style.display = "none";
    });

    // Mostrar la sección solicitada
    const seccionActiva = document.getElementById(seccion);
    if (seccionActiva) {
        seccionActiva.style.display = "block";
    }

    // Cargar datos según la sección
    if (seccion === "testVocacional") cargarPreguntas();
    if (seccion === "perfil") cargarPerfil();
    if (seccion === "misRutas") cargarMisRutas();

    // Actualizar la navegación
    actualizarNavegacion();
}

function actualizarNavegacion() {
    const logueado = localStorage.getItem("usuarioId") !== null;

    // Mostrar/ocultar botones según si el usuario está logueado
    document.getElementById("navRegistro").style.display = logueado ? "none" : "";
    document.getElementById("navLogin").style.display = logueado ? "none" : "";
    document.getElementById("navPerfil").style.display = logueado ? "" : "none";
    document.getElementById("navRutas").style.display = logueado ? "" : "none";
    document.getElementById("navTest").style.display = logueado ? "" : "none";
    document.getElementById("navLogout").style.display = logueado ? "" : "none";
}

// =============================================
// REGISTRO DE USUARIO
// =============================================
// Envía los datos del formulario al servidor.
// El servidor encripta la contraseña antes de guardarla.

async function registrar() {
    const nombre = document.getElementById("nombre").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const passwordConfirm = document.getElementById("passwordConfirm").value;
    const edad = document.getElementById("edad").value;

    // Validaciones en el frontend (antes de enviar al servidor)
    if (!nombre || !email || !password) {
        return mostrarToast("Completa todos los campos obligatorios", "warning");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return mostrarToast("Ingresa un email válido", "warning");
    }

    if (password.length < 4) {
        return mostrarToast("La contraseña debe tener al menos 4 caracteres", "warning");
    }

    // Verificar que ambas contraseñas coincidan
    if (password !== passwordConfirm) {
        return mostrarToast("Las contraseñas no coinciden", "error");
    }

    try {
        const res = await fetch("/registro", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nombre, email, password, edad: edad || null })
        });

        const data = await res.json();

        if (!res.ok) {
            return mostrarToast(data.error, "error");
        }

        mostrarToast("¡Cuenta creada exitosamente!", "success");
        // Limpiar formulario
        document.getElementById("nombre").value = "";
        document.getElementById("email").value = "";
        document.getElementById("password").value = "";
        document.getElementById("passwordConfirm").value = "";
        document.getElementById("edad").value = "";
        // Ir al login después de 1 segundo
        setTimeout(() => mostrar("login"), 1000);
    } catch (error) {
        mostrarToast("Error al conectar con el servidor", "error");
    }
}

// =============================================
// LOGIN (Inicio de Sesión)
// =============================================
// Envía email y contraseña, el servidor verifica con bcrypt.
// Si es correcto, guarda el ID y nombre en localStorage.

async function login() {
    const email = document.getElementById("emailLogin").value.trim();
    const password = document.getElementById("passwordLogin").value;

    if (!email || !password) {
        return mostrarToast("Ingresa tu email y contraseña", "warning");
    }

    try {
        const res = await fetch("/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (!res.ok) {
            return mostrarToast(data.error, "error");
        }

        // Guardar datos de sesión en localStorage
        // localStorage persiste los datos incluso al cerrar el navegador
        localStorage.setItem("usuarioId", data.id);
        localStorage.setItem("usuarioNombre", data.nombre);

        mostrarToast(`¡Bienvenido, ${data.nombre}!`, "success");

        // Limpiar formulario
        document.getElementById("emailLogin").value = "";
        document.getElementById("passwordLogin").value = "";

        setTimeout(() => mostrar("perfil"), 800);
    } catch (error) {
        mostrarToast("Error al conectar con el servidor", "error");
    }
}

// =============================================
// CERRAR SESIÓN
// =============================================

function cerrarSesion() {
    localStorage.removeItem("usuarioId");
    localStorage.removeItem("usuarioNombre");
    mostrarToast("Sesión cerrada correctamente", "info");
    mostrar("landing");
}

// =============================================
// PERFIL DEL USUARIO
// =============================================
// Carga la info del usuario, su último resultado y su historial.

async function cargarPerfil() {
    const id = localStorage.getItem("usuarioId");
    if (!id) {
        mostrarToast("Debes iniciar sesión para ver tu perfil", "warning");
        return mostrar("login");
    }

    // Cargar info básica del usuario
    try {
        const res = await fetch("/perfil/" + id);
        const user = await res.json();

        const contenedor = document.getElementById("infoPerfil");
        // Crear iniciales para el avatar (primera letra del nombre)
        const iniciales = user.nombre.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

        contenedor.innerHTML = `
            <div class="perfil-card-content">
                <div class="avatar">${iniciales}</div>
                <div class="perfil-datos">
                    <h2>${user.nombre}</h2>
                    <p>Correo: ${user.email}</p>
                    <p>Edad: ${user.edad ? user.edad + " años" : "Edad no registrada"}</p>
                </div>
            </div>
            <button class="btn-primary" onclick="mostrar('testVocacional')" style="margin-top:20px;">
                Realizar Test Vocacional
            </button>
        `;
    } catch (error) {
        mostrarToast("Error al cargar perfil", "error");
    }

    // Cargar último resultado
    await cargarUltimoResultado(id);

    // Cargar historial
    await cargarHistorial(id);
}

async function cargarUltimoResultado(userId) {
    try {
        const res = await fetch("/resultado/" + userId);
        if (!res.ok) {
            document.getElementById("ultimoResultado").style.display = "none";
            return;
        }

        const resultado = await res.json();
        const seccion = document.getElementById("ultimoResultado");
        seccion.style.display = "block";

        document.getElementById("contenidoUltimoResultado").innerHTML =
            generarHTMLResultado(resultado.puntajes, resultado.recomendaciones);
    } catch (error) {
        document.getElementById("ultimoResultado").style.display = "none";
    }
}

async function cargarHistorial(userId) {
    try {
        const res = await fetch("/historial/" + userId);
        const historial = await res.json();

        if (historial.length === 0) {
            document.getElementById("seccionHistorial").style.display = "none";
            return;
        }

        const seccion = document.getElementById("seccionHistorial");
        seccion.style.display = "block";

        const contenedor = document.getElementById("contenedorHistorial");
        contenedor.innerHTML = historial.map((r, i) => {
            const fecha = new Date(r.fecha).toLocaleDateString("es-ES", {
                day: "numeric", month: "long", year: "numeric"
            });
            return `
                <div class="historial-item">
                    <div class="historial-fecha">${fecha}</div>
                    <div class="historial-perfil">
                        <span>${r.recomendaciones.perfil}</span>
                    </div>
                </div>
            `;
        }).join("");
    } catch (error) {
        document.getElementById("seccionHistorial").style.display = "none";
    }
}

// =============================================
// TEST VOCACIONAL - Paso a Paso
// =============================================
// El test muestra una pregunta a la vez con opciones clickeables.
// Al seleccionar una opción, avanza automáticamente a la siguiente.

async function cargarPreguntas() {
    try {
        const res = await fetch("/preguntas");
        preguntasTest = await res.json();
        preguntaActual = 0;
        respuestasUsuario = [];
        mostrarPreguntaActual();
    } catch (error) {
        mostrarToast("Error al cargar preguntas", "error");
    }
}

function mostrarPreguntaActual() {
    const contenedor = document.getElementById("contenedorPreguntas");
    const total = preguntasTest.length;

    // Actualizar barra de progreso
    const progreso = ((preguntaActual) / total) * 100;
    document.getElementById("barraProgreso").style.width = progreso + "%";
    document.getElementById("textoProgreso").textContent =
        `Pregunta ${preguntaActual + 1} de ${total}`;

    // Si ya terminaron todas las preguntas
    if (preguntaActual >= total) {
        document.getElementById("barraProgreso").style.width = "100%";
        document.getElementById("textoProgreso").textContent = "¡Test completado!";
        contenedor.innerHTML = `
            <div class="test-finalizar">
                <div class="test-finalizar-icon icon-completado">✓</div>
                <h3>¡Has respondido todas las preguntas!</h3>
                <p>Haz clic en el botón para ver tus resultados</p>
                <button class="btn-primary btn-lg" onclick="enviarRespuestas()">
                    Ver mis resultados
                </button>
            </div>
        `;
        return;
    }

    // Mostrar la pregunta actual con animación
    const p = preguntasTest[preguntaActual];
    const opciones = Array.isArray(p.opciones) ? p.opciones : JSON.parse(p.opciones);

    contenedor.innerHTML = `
        <div class="pregunta-card animate-in">
            <span class="pregunta-categoria">${p.categoria.toUpperCase()}</span>
            <h3 class="pregunta-texto">${p.texto}</h3>
            <div class="opciones-grid">
                ${opciones.map((op, i) => `
                    <button class="opcion-card" onclick="seleccionarOpcion(${p.id}, '${op.texto.replace(/'/g, "\\'")}', '${op.perfil}')">
                        <span class="opcion-letra">${String.fromCharCode(65 + i)}</span>
                        <span class="opcion-texto">${op.texto}</span>
                    </button>
                `).join("")}
            </div>
        </div>
    `;
}

function seleccionarOpcion(preguntaId, respuesta, perfil) {
    // Guardar la respuesta
    respuestasUsuario.push({
        pregunta_id: preguntaId,
        respuesta: respuesta,
        perfil: perfil
    });

    // Efecto visual de selección
    event.currentTarget.classList.add("opcion-seleccionada");

    // Avanzar a la siguiente pregunta después de una breve pausa
    setTimeout(() => {
        preguntaActual++;
        mostrarPreguntaActual();
    }, 350);
}

// =============================================
// ENVIAR RESPUESTAS Y MOSTRAR RESULTADOS
// =============================================

async function enviarRespuestas() {
    const usuarioId = localStorage.getItem("usuarioId");

    if (!usuarioId) {
        mostrarToast("Debes iniciar sesión para guardar el test", "warning");
        return mostrar("login");
    }

    if (respuestasUsuario.length === 0) {
        return mostrarToast("No hay respuestas para enviar", "warning");
    }

    try {
        const res = await fetch("/respuestas", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                usuario_id: parseInt(usuarioId),
                respuestas: respuestasUsuario
            })
        });

        const data = await res.json();

        if (!res.ok) {
            return mostrarToast(data.error, "error");
        }

        mostrarToast("¡Test completado exitosamente!", "success");

        // Mostrar la sección de resultados
        mostrarResultados(data.resultado);
    } catch (error) {
        mostrarToast("Error al enviar respuestas", "error");
    }
}

function mostrarResultados(resultado) {
    // Mostrar la sección de resultados
    document.querySelectorAll(".seccion-pantalla").forEach(div => {
        div.style.display = "none";
    });
    document.getElementById("resultados").style.display = "block";

    const contenedor = document.getElementById("contenidoResultados");
    contenedor.innerHTML = generarHTMLResultado(resultado.puntajes, resultado.recomendaciones);
}

// =============================================
// GENERADOR DE HTML PARA RESULTADOS
// =============================================
// Esta función crea el HTML visual de los resultados.
// Se usa tanto en la página de resultados como en el perfil.

function generarHTMLResultado(puntajes, recomendaciones) {
    const totalPreguntas = 8;

    // Información visual de cada perfil
    const perfilesInfo = {
        cientifico: { nombre: "Científico", color: "#3b82f6", letra: "△" },
        creativo:   { nombre: "Creativo",   color: "#a855f7", letra: "◇" },
        social:     { nombre: "Social",     color: "#10b981", letra: "○" },
        practico:   { nombre: "Práctico",   color: "#f59e0b", letra: "□" }
    };

    // Generar las barras de puntuación
    const barrasHTML = Object.keys(perfilesInfo).map(key => {
        const info = perfilesInfo[key];
        const puntos = puntajes[key] || 0;
        const porcentaje = Math.round((puntos / totalPreguntas) * 100);
        const esDominante = porcentaje === Math.max(...Object.values(puntajes).map(v => Math.round((v/totalPreguntas)*100)));

        return `
            <div class="barra-perfil">
                <div class="barra-label">
                    <span><span class="perfil-letra" style="background:${info.color}">${info.letra}</span> ${info.nombre}</span>
                    <span class="barra-valor">${puntos}/${totalPreguntas} (${porcentaje}%)</span>
                </div>
                <div class="barra-track">
                    <div class="barra-fill" style="width: ${porcentaje}%; background: ${info.color};" data-width="${porcentaje}"></div>
                </div>
            </div>
        `;
    }).join("");

    // Generar lista de carreras recomendadas
    const carrerasHTML = recomendaciones.carreras.map(c =>
        `<span class="carrera-tag">${c}</span>`
    ).join("");

    return `
        <div class="resultado-perfil-card">
            <h3 class="resultado-nombre">${recomendaciones.perfil}</h3>
            <p class="resultado-desc">${recomendaciones.descripcion}</p>
        </div>
        <div class="resultado-barras">
            <h4>Distribución de tu perfil</h4>
            ${barrasHTML}
        </div>
        <div class="resultado-carreras">
            <h4>Carreras recomendadas para ti</h4>
            <div class="carreras-grid">${carrerasHTML}</div>
        </div>
    `;
}

// =============================================
// INICIALIZACIÓN
// =============================================
// Al cargar la página, verificar si hay una sesión activa
// y mostrar la sección correspondiente.

document.addEventListener("DOMContentLoaded", () => {
    const usuarioId = localStorage.getItem("usuarioId");
    if (usuarioId) {
        mostrar("perfil");
    } else {
        mostrar("landing");
    }

    // Animar las barras de resultados cuando sean visibles
    // MutationObserver vigila cambios en el DOM
    const observer = new MutationObserver(() => {
        document.querySelectorAll(".barra-fill").forEach(barra => {
            const width = barra.getAttribute("data-width");
            if (width) {
                setTimeout(() => {
                    barra.style.width = width + "%";
                }, 100);
            }
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });
});

// =============================================
// LÓGICA DE RUTAS DE APRENDIZAJE (CURSOS)
// =============================================

async function cargarMisRutas() {
    const usuarioId = localStorage.getItem("usuarioId");
    if (!usuarioId) return mostrar("login");

    try {
        // 1. Obtener el perfil dominante del usuario desde su último resultado
        const resRes = await fetch(`/resultado/${usuarioId}`);
        if (!resRes.ok) {
            document.getElementById("contenedorRutas").innerHTML = `
                <div class="glass-card" style="text-align:center; grid-column: 1/-1;">
                    <p>Primero debes realizar el Test Vocacional para descubrir tu ruta.</p>
                    <button class="btn-primary" onclick="mostrar('testVocacional')" style="margin-top:15px;">Realizar Test</button>
                </div>`;
            return;
        }
        const resultado = await resRes.json();
        
        // El perfil viene del servidor (ej: "cientifico", "creativo")
        // Necesitamos mapear el nombre legible al ID del perfil si es necesario
        // En este caso el backend espera el key (cientifico, creativo, etc)
        const perfilKey = Object.keys(resultado.puntajes).reduce((a, b) => 
            resultado.puntajes[a] > resultado.puntajes[b] ? a : b
        );
        perfilUsuario = perfilKey;

        // 2. Obtener los cursos de ese perfil con el progreso del usuario
        const resCursos = await fetch(`/cursos/${perfilKey}/progreso/${usuarioId}`);
        const cursos = await resCursos.json();

        const contenedor = document.getElementById("contenedorRutas");
        if (cursos.length === 0) {
            contenedor.innerHTML = "<p>No hay cursos disponibles para tu perfil aún.</p>";
            return;
        }

        contenedor.innerHTML = cursos.map(c => {
            const porcentaje = c.total_modulos > 0 ? Math.round((c.modulos_completados / c.total_modulos) * 100) : 0;
            return `
                <div class="curso-card animate-in" onclick="verCurso(${c.id}, '${c.titulo.replace(/'/g, "\\'")}', '${c.descripcion.replace(/'/g, "\\'")}')">
                    <div class="curso-icono">${c.icono || "◈"}</div>
                    <div class="curso-info">
                        <h3>${c.titulo}</h3>
                        <p>${c.descripcion}</p>
                    </div>
                    <div class="progreso-container">
                        <div class="progreso-header">
                            <span>Progreso</span>
                            <span>${porcentaje}%</span>
                        </div>
                        <div class="progreso-bar-track">
                            <div class="progreso-bar-fill" style="width: ${porcentaje}%"></div>
                        </div>
                    </div>
                </div>
            `;
        }).join("");

    } catch (error) {
        console.error("Error al cargar rutas:", error);
        mostrarToast("Error al cargar tus rutas de aprendizaje", "error");
    }
}

async function verCurso(cursoId, titulo, descripcion) {
    const usuarioId = localStorage.getItem("usuarioId");
    cursoSeleccionadoId = cursoId;
    
    document.getElementById("tituloCurso").textContent = titulo;
    document.getElementById("descCurso").textContent = descripcion;
    mostrar("vistaCurso");

    try {
        // Inscribir al usuario automáticamente si no lo está
        await fetch("/inscripcion", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ usuario_id: usuarioId, curso_id: cursoId })
        });

        // Cargar módulos
        const res = await fetch(`/modulos/${cursoId}/${usuarioId}`);
        const modulos = await res.json();

        const contenedor = document.getElementById("contenedorModulos");
        contenedor.innerHTML = modulos.map(m => `
            <div class="modulo-item-card animate-in" onclick="verModulo(${m.id})">
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <span class="pregunta-categoria">MÓDULO ${m.orden}</span>
                    ${m.completado ? '<span style="color:var(--success); font-size:1.2rem;">✓</span>' : ""}
                </div>
                <h3 style="margin: 10px 0;">${m.titulo}</h3>
                <p style="font-size:0.85rem; color:var(--text-secondary);">${m.descripcion}</p>
                <div style="margin-top:15px;">
                    <button class="btn-secondary btn-full" style="padding: 8px;">
                        ${m.completado ? "Repasar Contenido" : "Comenzar Módulo"}
                    </button>
                </div>
            </div>
        `).join("");

    } catch (error) {
        mostrarToast("Error al cargar el curso", "error");
    }
}

async function verModulo(moduloId) {
    mostrar("vistaModulo");
    document.getElementById("contenedorVideo").innerHTML = "<p>Cargando contenido...</p>";
    document.getElementById("contenedorLectura").innerHTML = "";
    document.getElementById("seccionQuiz").style.display = "none";

    try {
        const res = await fetch(`/modulo/${moduloId}`);
        const modulo = await res.json();
        moduloActual = modulo;

        document.getElementById("tituloModulo").textContent = modulo.titulo;
        
        // Video embed
        if (modulo.video_url) {
            const videoId = modulo.video_url.split("/").pop();
            document.getElementById("contenedorVideo").innerHTML = `
                <div class="video-wrapper">
                    <iframe src="https://www.youtube.com/embed/${videoId}" allowfullscreen></iframe>
                </div>`;
        } else {
            document.getElementById("contenedorVideo").innerHTML = "";
        }

        // Lectura (convertir markdown simple a HTML)
        document.getElementById("contenedorLectura").innerHTML = modulo.lectura
            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
            .replace(/\n/g, "<br>");

        // Quiz
        if (modulo.quiz && modulo.quiz.length > 0) {
            document.getElementById("seccionQuiz").style.display = "block";
            preguntaQuizActual = 0;
            puntajeQuiz = 0;
            mostrarPreguntaQuiz();
        }

        // Botón volver
        document.getElementById("btnVolverCurso").onclick = () => {
            // Recargar la vista del curso para ver el progreso actualizado
            const titulo = document.getElementById("tituloCurso").textContent;
            const desc = document.getElementById("descCurso").textContent;
            verCurso(modulo.curso_id, titulo, desc);
        };

    } catch (error) {
        mostrarToast("Error al cargar el módulo", "error");
    }
}

function mostrarPreguntaQuiz() {
    const quiz = moduloActual.quiz;
    const q = quiz[preguntaQuizActual];
    
    document.getElementById("preguntaQuiz").textContent = `${preguntaQuizActual + 1}. ${q.pregunta}`;
    const contenedorOpciones = document.getElementById("opcionesQuiz");
    
    contenedorOpciones.innerHTML = q.opciones.map((op, i) => `
        <button class="opcion-card" onclick="seleccionarOpcionQuiz(${i})">
            <span class="opcion-letra">${String.fromCharCode(65 + i)}</span>
            <span class="opcion-texto">${op}</span>
        </button>
    `).join("");
    
    document.getElementById("btnSiguienteQuiz").style.display = "none";
}

function seleccionarOpcionQuiz(index) {
    const quiz = moduloActual.quiz;
    const q = quiz[preguntaQuizActual];
    const botones = document.querySelectorAll("#opcionesQuiz .opcion-card");
    
    // Deshabilitar botones para que no cambie de opinión
    botones.forEach(b => b.onclick = null);
    
    if (index === q.correcta) {
        puntajeQuiz++;
        botones[index].classList.add("toast-success");
        botones[index].style.borderColor = "var(--success)";
        mostrarToast("¡Correcto!", "success");
    } else {
        botones[index].classList.add("toast-error");
        botones[index].style.borderColor = "var(--error)";
        botones[q.correcta].style.borderColor = "var(--success)";
        mostrarToast("Incorrecto", "error");
    }

    const btnSig = document.getElementById("btnSiguienteQuiz");
    btnSig.style.display = "block";
    
    if (preguntaQuizActual < quiz.length - 1) {
        btnSig.textContent = "Siguiente Pregunta";
        btnSig.onclick = () => {
            preguntaQuizActual++;
            mostrarPreguntaQuiz();
        };
    } else {
        btnSig.textContent = "Finalizar Quiz";
        btnSig.onclick = finalizarQuiz;
    }
}

async function finalizarQuiz() {
    const usuarioId = localStorage.getItem("usuarioId");
    const total = moduloActual.quiz.length;
    
    try {
        const res = await fetch("/progreso", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                usuario_id: usuarioId,
                modulo_id: moduloActual.id,
                puntaje: puntajeQuiz,
                total_preguntas: total
            })
        });
        
        const data = await res.json();
        
        if (data.completado) {
            mostrarToast(`¡Felicidades! Aprobaste con ${puntajeQuiz}/${total}`, "success");
        } else {
            mostrarToast(`Obtuviste ${puntajeQuiz}/${total}. Necesitas al menos 2 correctas para aprobar.`, "warning");
        }
        
        // Volver a la vista del curso
        document.getElementById("btnVolverCurso").click();
        
    } catch (error) {
        mostrarToast("Error al guardar progreso", "error");
    }
}
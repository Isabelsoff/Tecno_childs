// =============================================
// TecnoChilds - Servidor Backend (Express + MySQL)
// =============================================
// Este archivo configura el servidor web, conecta a MySQL,
// y define todos los endpoints (rutas) de la API.

const express = require("express");
const mysql = require("mysql2/promise"); // Versión con Promesas para código más limpio
const bcrypt = require("bcryptjs");       // Para encriptar contraseñas
const cors = require("cors");             // Para permitir peticiones desde otros orígenes
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 4000;

// ---- Middlewares ----
// Middleware = funciones que procesan cada petición antes de llegar a las rutas
app.use(cors());                          // Permite peticiones cross-origin
app.use(express.json());                  // Permite recibir JSON en el body de las peticiones

// Servir archivos estáticos del frontend (HTML, CSS, JS, imágenes)
const frontendPath = path.resolve(__dirname, "../Frontend");
app.use(express.static(frontendPath));

// ---- Conexión a MySQL ----
// Usamos un "pool" de conexiones: es más eficiente que una sola conexión
// porque permite múltiples consultas simultáneas sin bloquearse.
let pool;

async function inicializarDB() {
    try {
        // Primero conectar sin base de datos para poder crearla
        const conexionInicial = await mysql.createConnection({
            host: "localhost",
            user: "root",
            password: "120140213.s",
        });

        // Crear la base de datos si no existe
        await conexionInicial.execute(
            "CREATE DATABASE IF NOT EXISTS tecnochilds CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
        );
        await conexionInicial.end();

        // Ahora crear el pool conectado a la base de datos
        pool = mysql.createPool({
            host: "localhost",
            user: "root",
            password: "120140213.s",
            database: "tecnochilds",
            waitForConnections: true,
            connectionLimit: 10,      // Máximo 10 conexiones simultáneas
            queueLimit: 0
        });

        // Crear las tablas
        await crearTablas();
        // Insertar las preguntas del test
        await insertarPreguntas();

        console.log("✅ Base de datos MySQL conectada y tablas verificadas");
    } catch (error) {
        console.error("❌ Error al conectar con MySQL:", error.message);
        console.error("   Asegúrate de que MySQL esté corriendo y verifica usuario/contraseña.");
        process.exit(1); // Terminar si no hay conexión
    }
}

async function crearTablas() {
    // Tabla de usuarios
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS usuarios (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nombre VARCHAR(100) NOT NULL,
            email VARCHAR(150) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            edad INT,
            fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Tabla de preguntas del test vocacional
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS preguntas (
            id INT AUTO_INCREMENT PRIMARY KEY,
            texto VARCHAR(500) NOT NULL,
            categoria VARCHAR(50) NOT NULL,
            opciones JSON NOT NULL
        )
    `);

    // Tabla de respuestas individuales
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS respuestas (
            id INT AUTO_INCREMENT PRIMARY KEY,
            usuario_id INT NOT NULL,
            pregunta_id INT NOT NULL,
            respuesta VARCHAR(500) NOT NULL,
            perfil VARCHAR(50),
            fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
            FOREIGN KEY (pregunta_id) REFERENCES preguntas(id)
        )
    `);

    // Tabla de resultados (análisis completo de cada test)
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS resultados (
            id INT AUTO_INCREMENT PRIMARY KEY,
            usuario_id INT NOT NULL,
            perfil_dominante VARCHAR(50) NOT NULL,
            puntajes JSON NOT NULL,
            recomendaciones JSON NOT NULL,
            fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        )
    `);
}

async function insertarPreguntas() {
    // Verificar si ya existen preguntas
    const [rows] = await pool.execute("SELECT COUNT(*) as total FROM preguntas");
    if (rows[0].total > 0) return; // Ya hay preguntas, no insertar de nuevo

    const preguntas = [
        {
            texto: "¿Qué actividad disfrutas más en tu tiempo libre?",
            categoria: "intereses",
            opciones: [
                { texto: "Leer, investigar o aprender cosas nuevas", perfil: "cientifico" },
                { texto: "Dibujar, crear música o escribir historias", perfil: "creativo" },
                { texto: "Hacer deporte o actividades al aire libre", perfil: "practico" },
                { texto: "Ayudar a otros o trabajar en equipo", perfil: "social" }
            ]
        },
        {
            texto: "¿Qué tipo de problemas te gusta resolver?",
            categoria: "intereses",
            opciones: [
                { texto: "Matemáticos o de lógica", perfil: "cientifico" },
                { texto: "Creativos o de diseño", perfil: "creativo" },
                { texto: "Técnicos o mecánicos", perfil: "practico" },
                { texto: "De comunicación o relaciones", perfil: "social" }
            ]
        },
        {
            texto: "¿Qué te motiva más en la vida?",
            categoria: "intereses",
            opciones: [
                { texto: "Aprender y descubrir cosas nuevas", perfil: "cientifico" },
                { texto: "Crear e innovar", perfil: "creativo" },
                { texto: "Construir y reparar", perfil: "practico" },
                { texto: "Ayudar y enseñar a otros", perfil: "social" }
            ]
        },
        {
            texto: "¿Qué materias se te hacen más fáciles en la escuela?",
            categoria: "habilidades",
            opciones: [
                { texto: "Matemáticas y ciencias", perfil: "cientifico" },
                { texto: "Artes y música", perfil: "creativo" },
                { texto: "Tecnología y computación", perfil: "practico" },
                { texto: "Lenguaje, historia o ciencias sociales", perfil: "social" }
            ]
        },
        {
            texto: "¿Qué tipo de tareas prefieres?",
            categoria: "habilidades",
            opciones: [
                { texto: "Analíticas: calcular, planificar, investigar", perfil: "cientifico" },
                { texto: "Creativas: diseñar, inventar, imaginar", perfil: "creativo" },
                { texto: "Manuales: construir, reparar, operar", perfil: "practico" },
                { texto: "Sociales: enseñar, organizar, comunicar", perfil: "social" }
            ]
        },
        {
            texto: "¿Qué es más importante para ti en un trabajo?",
            categoria: "valores",
            opciones: [
                { texto: "Resolver problemas complejos", perfil: "cientifico" },
                { texto: "Expresar mi creatividad", perfil: "creativo" },
                { texto: "Trabajar con herramientas o tecnología", perfil: "practico" },
                { texto: "Ayudar a las personas", perfil: "social" }
            ]
        },
        {
            texto: "¿En qué ambiente te sentirías más cómodo trabajando?",
            categoria: "contexto",
            opciones: [
                { texto: "En un laboratorio o centro de investigación", perfil: "cientifico" },
                { texto: "En un estudio o taller creativo", perfil: "creativo" },
                { texto: "En una fábrica, taller mecánico o al aire libre", perfil: "practico" },
                { texto: "En una escuela, hospital o comunidad", perfil: "social" }
            ]
        },
        {
            texto: "¿Cómo te imaginas en 5 años?",
            categoria: "proyeccion",
            opciones: [
                { texto: "Estudiando una carrera de ciencias o ingeniería", perfil: "cientifico" },
                { texto: "Desarrollando proyectos artísticos o de diseño", perfil: "creativo" },
                { texto: "Aprendiendo un oficio técnico o emprendiendo", perfil: "practico" },
                { texto: "Trabajando ayudando a otras personas", perfil: "social" }
            ]
        }
    ];

    for (const p of preguntas) {
        await pool.execute(
            "INSERT INTO preguntas (texto, categoria, opciones) VALUES (?, ?, ?)",
            [p.texto, p.categoria, JSON.stringify(p.opciones)]
        );
    }
    console.log("📝 Preguntas del test insertadas correctamente");
}

// ---- Mapa de recomendaciones por perfil vocacional ----
// Esto define qué carreras se recomiendan según el perfil dominante
const PERFILES = {
    cientifico: {
        nombre: "Científico-Tecnológico",
        emoji: "🔬",
        descripcion: "Tienes una mente analítica y curiosa. Te apasiona entender cómo funcionan las cosas y resolver problemas con lógica.",
        carreras: ["Ingeniería", "Medicina", "Biología", "Física", "Programación", "Matemáticas"]
    },
    creativo: {
        nombre: "Artístico-Creativo",
        emoji: "🎨",
        descripcion: "Tienes gran imaginación y sensibilidad artística. Te expresas mejor a través del arte y la creatividad.",
        carreras: ["Diseño Gráfico", "Arquitectura", "Música", "Cine y Animación", "Publicidad", "Arte Digital"]
    },
    social: {
        nombre: "Social-Humanístico",
        emoji: "🤝",
        descripcion: "Te importan las personas y la sociedad. Tienes empatía, vocación de servicio y habilidades de comunicación.",
        carreras: ["Psicología", "Educación", "Trabajo Social", "Derecho", "Enfermería", "Comunicación"]
    },
    practico: {
        nombre: "Práctico-Técnico",
        emoji: "🔧",
        descripcion: "Eres hábil con las manos y la tecnología. Disfrutas resolver problemas prácticos del mundo real.",
        carreras: ["Mecatrónica", "Electrónica", "Gastronomía", "Construcción", "Agricultura", "Técnico en Sistemas"]
    }
};

// =============================================
// RUTAS DE LA API
// =============================================

// ---- REGISTRO de usuario ----
// Recibe: { nombre, email, password, edad }
// La contraseña se encripta con bcrypt antes de guardarla
app.post("/registro", async (req, res) => {
    try {
        const { nombre, email, password, edad } = req.body;

        // Validar que los campos obligatorios no estén vacíos
        if (!nombre || !email || !password) {
            return res.status(400).json({ error: "Nombre, email y contraseña son obligatorios" });
        }

        // Validar formato de email con expresión regular
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: "El formato del email no es válido" });
        }

        // Validar contraseña mínima
        if (password.length < 4) {
            return res.status(400).json({ error: "La contraseña debe tener al menos 4 caracteres" });
        }

        // Encriptar la contraseña (el "10" es el costo de salt rounds)
        // Esto convierte "mipassword" en algo como "$2a$10$xK8f..."
        const passwordHash = await bcrypt.hash(password, 10);

        // Insertar en la base de datos
        const [result] = await pool.execute(
            "INSERT INTO usuarios (nombre, email, password, edad) VALUES (?, ?, ?, ?)",
            [nombre, email, passwordHash, edad || null]
        );

        res.json({ mensaje: "Usuario registrado con éxito", id: result.insertId });
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ error: "Este email ya está registrado" });
        }
        console.error("Error en registro:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

// ---- LOGIN ----
// Recibe: { email, password }
// Compara la contraseña ingresada con el hash almacenado
app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email y contraseña son obligatorios" });
        }

        // Buscar al usuario por email
        const [rows] = await pool.execute(
            "SELECT * FROM usuarios WHERE email = ?", [email]
        );

        if (rows.length === 0) {
            return res.status(401).json({ error: "Credenciales incorrectas" });
        }

        const user = rows[0];

        // Comparar la contraseña con el hash guardado
        // bcrypt.compare("mipassword", "$2a$10$xK8f...") → true/false
        const passwordValida = await bcrypt.compare(password, user.password);

        if (!passwordValida) {
            return res.status(401).json({ error: "Credenciales incorrectas" });
        }

        // Devolver datos del usuario (SIN la contraseña por seguridad)
        res.json({
            id: user.id,
            nombre: user.nombre,
            email: user.email,
            edad: user.edad
        });
    } catch (error) {
        console.error("Error en login:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

// ---- PERFIL del usuario ----
// Devuelve los datos básicos de un usuario por su ID
app.get("/perfil/:id", async (req, res) => {
    try {
        const [rows] = await pool.execute(
            "SELECT nombre, email, edad, fecha_registro FROM usuarios WHERE id = ?",
            [req.params.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error("Error al obtener perfil:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

// ---- OBTENER PREGUNTAS del test ----
// Devuelve todas las preguntas con sus opciones
app.get("/preguntas", async (req, res) => {
    try {
        const [rows] = await pool.execute("SELECT * FROM preguntas ORDER BY id");
        // Parsear el JSON de opciones para cada pregunta
        const preguntas = rows.map(p => ({
            ...p,
            opciones: typeof p.opciones === "string" ? JSON.parse(p.opciones) : p.opciones
        }));
        res.json(preguntas);
    } catch (error) {
        console.error("Error al obtener preguntas:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

// ---- ENVIAR RESPUESTAS y calcular resultados ----
// Recibe: { usuario_id, respuestas: [{ pregunta_id, respuesta, perfil }] }
// 1. Guarda cada respuesta en la tabla respuestas
// 2. Cuenta los perfiles para determinar el dominante
// 3. Guarda y devuelve el resultado con recomendaciones
app.post("/respuestas", async (req, res) => {
    try {
        const { usuario_id, respuestas } = req.body;

        if (!usuario_id || !respuestas || respuestas.length === 0) {
            return res.status(400).json({ error: "Datos incompletos" });
        }

        // 1. Guardar cada respuesta y contar perfiles
        const conteoPerfiles = { cientifico: 0, creativo: 0, social: 0, practico: 0 };

        for (const r of respuestas) {
            await pool.execute(
                "INSERT INTO respuestas (usuario_id, pregunta_id, respuesta, perfil) VALUES (?, ?, ?, ?)",
                [usuario_id, r.pregunta_id, r.respuesta, r.perfil]
            );
            // Sumar al conteo del perfil correspondiente
            if (conteoPerfiles.hasOwnProperty(r.perfil)) {
                conteoPerfiles[r.perfil]++;
            }
        }

        // 2. Determinar el perfil dominante (el que tiene más puntos)
        const perfilDominante = Object.keys(conteoPerfiles)
            .reduce((a, b) => conteoPerfiles[a] >= conteoPerfiles[b] ? a : b);

        // 3. Obtener las recomendaciones del perfil dominante
        const infoPerfil = PERFILES[perfilDominante];
        const recomendaciones = {
            perfil: infoPerfil.nombre,
            emoji: infoPerfil.emoji,
            descripcion: infoPerfil.descripcion,
            carreras: infoPerfil.carreras
        };

        // 4. Guardar el resultado en la base de datos
        const [result] = await pool.execute(
            "INSERT INTO resultados (usuario_id, perfil_dominante, puntajes, recomendaciones) VALUES (?, ?, ?, ?)",
            [usuario_id, perfilDominante, JSON.stringify(conteoPerfiles), JSON.stringify(recomendaciones)]
        );

        // 5. Devolver el resultado al frontend
        res.json({
            mensaje: "Test completado exitosamente",
            resultado: {
                id: result.insertId,
                perfil_dominante: perfilDominante,
                puntajes: conteoPerfiles,
                recomendaciones: recomendaciones
            }
        });
    } catch (error) {
        console.error("Error al guardar respuestas:", error);
        res.status(500).json({ error: "Error al procesar el test" });
    }
});

// ---- HISTORIAL de resultados ----
// Devuelve todos los resultados de tests anteriores de un usuario
app.get("/historial/:usuario_id", async (req, res) => {
    try {
        const [rows] = await pool.execute(
            "SELECT * FROM resultados WHERE usuario_id = ? ORDER BY fecha DESC",
            [req.params.usuario_id]
        );

        // Parsear los JSON almacenados
        const historial = rows.map(r => ({
            ...r,
            puntajes: typeof r.puntajes === "string" ? JSON.parse(r.puntajes) : r.puntajes,
            recomendaciones: typeof r.recomendaciones === "string" ? JSON.parse(r.recomendaciones) : r.recomendaciones
        }));

        res.json(historial);
    } catch (error) {
        console.error("Error al obtener historial:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

// ---- ÚLTIMO RESULTADO de un usuario ----
app.get("/resultado/:usuario_id", async (req, res) => {
    try {
        const [rows] = await pool.execute(
            "SELECT * FROM resultados WHERE usuario_id = ? ORDER BY fecha DESC LIMIT 1",
            [req.params.usuario_id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: "No se encontraron resultados" });
        }

        const r = rows[0];
        res.json({
            ...r,
            puntajes: typeof r.puntajes === "string" ? JSON.parse(r.puntajes) : r.puntajes,
            recomendaciones: typeof r.recomendaciones === "string" ? JSON.parse(r.recomendaciones) : r.recomendaciones
        });
    } catch (error) {
        console.error("Error al obtener resultado:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

// ---- Iniciar el servidor ----
inicializarDB().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Servidor TecnoChilds corriendo en http://localhost:${PORT}`);
    });
});
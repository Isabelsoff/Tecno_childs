const express = require("express");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const CURSOS_CIENTIFICO = require("./cursosData");
const CURSOS_CREATIVO = require("./cursosCreativo");
const CURSOS_SOCIAL = require("./cursosSocial");
const CURSOS_PRACTICO = require("./cursosPractico");

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

const frontendPath = path.resolve(__dirname, "../Frontend");
app.use(express.static(frontendPath));

let pool;

async function inicializarDB() {
    try {
        const dbHost = process.env.DB_HOST || "localhost";
        const dbUser = process.env.DB_USER || "root";
        const dbPassword = process.env.DB_PASSWORD || "120140213.s";
        const dbName = process.env.DB_NAME || "tecnochilds";
        const dbPort = process.env.DB_PORT || 3306;

        // Intentar crear la base de datos solo si estamos en localhost
        // En la nube, los proveedores ya te dan la BD creada y bloquean este comando.
        if (dbHost === "localhost" || dbHost === "127.0.0.1") {
            try {
                const conexionInicial = await mysql.createConnection({
                    host: dbHost,
                    user: dbUser,
                    password: dbPassword,
                    port: dbPort,
                    ssl: { rejectUnauthorized: false }
                });
                await conexionInicial.execute(
                    `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
                );
                await conexionInicial.end();
            } catch (createErr) {
                console.log("No se pudo ejecutar CREATE DATABASE. Continuando con la conexión directa...");
            }
        }

        pool = mysql.createPool({
            host: dbHost,
            user: dbUser,
            password: dbPassword,
            database: dbName,
            port: dbPort,
            ssl: { rejectUnauthorized: false },
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });

        await crearTablas();
        await insertarPreguntas();
        await insertarCursos();

        console.log("Base de datos MySQL conectada y tablas verificadas");
    } catch (error) {
        console.error("Error al conectar con MySQL:", error.message);
        process.exit(1);
    }
}

async function crearTablas() {
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

    await pool.execute(`
        CREATE TABLE IF NOT EXISTS preguntas (
            id INT AUTO_INCREMENT PRIMARY KEY,
            texto VARCHAR(500) NOT NULL,
            categoria VARCHAR(50) NOT NULL,
            opciones JSON NOT NULL
        )
    `);

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

    await pool.execute(`
        CREATE TABLE IF NOT EXISTS cursos (
            id INT AUTO_INCREMENT PRIMARY KEY,
            perfil VARCHAR(50) NOT NULL,
            titulo VARCHAR(200) NOT NULL,
            descripcion TEXT NOT NULL,
            icono VARCHAR(10) NOT NULL,
            orden INT DEFAULT 1
        )
    `);

    await pool.execute(`
        CREATE TABLE IF NOT EXISTS modulos (
            id INT AUTO_INCREMENT PRIMARY KEY,
            curso_id INT NOT NULL,
            titulo VARCHAR(200) NOT NULL,
            descripcion TEXT,
            video_url VARCHAR(500) NOT NULL,
            lectura TEXT NOT NULL,
            quiz JSON NOT NULL,
            orden INT DEFAULT 1,
            FOREIGN KEY (curso_id) REFERENCES cursos(id)
        )
    `);

    await pool.execute(`
        CREATE TABLE IF NOT EXISTS inscripciones (
            id INT AUTO_INCREMENT PRIMARY KEY,
            usuario_id INT NOT NULL,
            curso_id INT NOT NULL,
            fecha_inscripcion DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_inscripcion (usuario_id, curso_id),
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
            FOREIGN KEY (curso_id) REFERENCES cursos(id)
        )
    `);

    await pool.execute(`
        CREATE TABLE IF NOT EXISTS progreso_usuario (
            id INT AUTO_INCREMENT PRIMARY KEY,
            usuario_id INT NOT NULL,
            modulo_id INT NOT NULL,
            puntaje INT NOT NULL DEFAULT 0,
            total_preguntas INT NOT NULL DEFAULT 3,
            completado BOOLEAN DEFAULT FALSE,
            fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_progreso (usuario_id, modulo_id),
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
            FOREIGN KEY (modulo_id) REFERENCES modulos(id)
        )
    `);
}

async function insertarPreguntas() {
    const [rows] = await pool.execute("SELECT COUNT(*) as total FROM preguntas");
    if (rows[0].total > 0) return;

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
}

async function insertarCursos() {
    const [rows] = await pool.execute("SELECT COUNT(*) as total FROM cursos");
    if (rows[0].total > 0) return;

    const todosCursos = [...CURSOS_CIENTIFICO, ...CURSOS_CREATIVO, ...CURSOS_SOCIAL, ...CURSOS_PRACTICO];

    for (const curso of todosCursos) {
        const [result] = await pool.execute(
            "INSERT INTO cursos (perfil, titulo, descripcion, icono, orden) VALUES (?, ?, ?, ?, ?)",
            [curso.perfil, curso.titulo, curso.descripcion, curso.icono, curso.orden]
        );
        const cursoId = result.insertId;

        for (const modulo of curso.modulos) {
            await pool.execute(
                "INSERT INTO modulos (curso_id, titulo, descripcion, video_url, lectura, quiz, orden) VALUES (?, ?, ?, ?, ?, ?, ?)",
                [cursoId, modulo.titulo, modulo.descripcion, modulo.video_url, modulo.lectura, JSON.stringify(modulo.quiz), modulo.orden]
            );
        }
    }
}

const PERFILES = {
    cientifico: {
        nombre: "Científico-Tecnológico",
        icono: "△",
        descripcion: "Tienes una mente analítica y curiosa. Te apasiona entender cómo funcionan las cosas y resolver problemas con lógica.",
        carreras: ["Ingeniería", "Medicina", "Biología", "Física", "Programación", "Matemáticas"]
    },
    creativo: {
        nombre: "Artístico-Creativo",
        icono: "◇",
        descripcion: "Tienes gran imaginación y sensibilidad artística. Te expresas mejor a través del arte y la creatividad.",
        carreras: ["Diseño Gráfico", "Arquitectura", "Música", "Cine y Animación", "Publicidad", "Arte Digital"]
    },
    social: {
        nombre: "Social-Humanístico",
        icono: "○",
        descripcion: "Te importan las personas y la sociedad. Tienes empatía, vocación de servicio y habilidades de comunicación.",
        carreras: ["Psicología", "Educación", "Trabajo Social", "Derecho", "Enfermería", "Comunicación"]
    },
    practico: {
        nombre: "Práctico-Técnico",
        icono: "□",
        descripcion: "Eres hábil con las manos y la tecnología. Disfrutas resolver problemas prácticos del mundo real.",
        carreras: ["Mecatrónica", "Electrónica", "Gastronomía", "Construcción", "Agricultura", "Técnico en Sistemas"]
    }
};

app.post("/registro", async (req, res) => {
    try {
        const { nombre, email, password, edad } = req.body;

        if (!nombre || !email || !password) {
            return res.status(400).json({ error: "Nombre, email y contraseña son obligatorios" });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: "El formato del email no es válido" });
        }

        if (password.length < 4) {
            return res.status(400).json({ error: "La contraseña debe tener al menos 4 caracteres" });
        }

        const passwordHash = await bcrypt.hash(password, 10);

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

app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email y contraseña son obligatorios" });
        }

        const [rows] = await pool.execute(
            "SELECT * FROM usuarios WHERE email = ?", [email]
        );

        if (rows.length === 0) {
            return res.status(401).json({ error: "Credenciales incorrectas" });
        }

        const user = rows[0];
        const passwordValida = await bcrypt.compare(password, user.password);

        if (!passwordValida) {
            return res.status(401).json({ error: "Credenciales incorrectas" });
        }

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

app.get("/preguntas", async (req, res) => {
    try {
        const [rows] = await pool.execute("SELECT * FROM preguntas ORDER BY id");
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

app.post("/respuestas", async (req, res) => {
    try {
        const { usuario_id, respuestas } = req.body;

        if (!usuario_id || !respuestas || respuestas.length === 0) {
            return res.status(400).json({ error: "Datos incompletos" });
        }

        const conteoPerfiles = { cientifico: 0, creativo: 0, social: 0, practico: 0 };

        for (const r of respuestas) {
            await pool.execute(
                "INSERT INTO respuestas (usuario_id, pregunta_id, respuesta, perfil) VALUES (?, ?, ?, ?)",
                [usuario_id, r.pregunta_id, r.respuesta, r.perfil]
            );
            if (conteoPerfiles.hasOwnProperty(r.perfil)) {
                conteoPerfiles[r.perfil]++;
            }
        }

        const perfilDominante = Object.keys(conteoPerfiles)
            .reduce((a, b) => conteoPerfiles[a] >= conteoPerfiles[b] ? a : b);

        const infoPerfil = PERFILES[perfilDominante];
        const recomendaciones = {
            perfil: infoPerfil.nombre,
            icono: infoPerfil.icono,
            descripcion: infoPerfil.descripcion,
            carreras: infoPerfil.carreras
        };

        const [result] = await pool.execute(
            "INSERT INTO resultados (usuario_id, perfil_dominante, puntajes, recomendaciones) VALUES (?, ?, ?, ?)",
            [usuario_id, perfilDominante, JSON.stringify(conteoPerfiles), JSON.stringify(recomendaciones)]
        );

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

app.get("/historial/:usuario_id", async (req, res) => {
    try {
        const [rows] = await pool.execute(
            "SELECT * FROM resultados WHERE usuario_id = ? ORDER BY fecha DESC",
            [req.params.usuario_id]
        );

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

app.get("/cursos/:perfil", async (req, res) => {
    try {
        const [cursos] = await pool.execute(
            "SELECT * FROM cursos WHERE perfil = ? ORDER BY orden",
            [req.params.perfil]
        );
        res.json(cursos);
    } catch (error) {
        console.error("Error al obtener cursos:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

app.get("/cursos/:perfil/progreso/:usuario_id", async (req, res) => {
    try {
        const [cursos] = await pool.execute(
            "SELECT * FROM cursos WHERE perfil = ? ORDER BY orden",
            [req.params.perfil]
        );

        const cursosConProgreso = [];
        for (const curso of cursos) {
            const [modulos] = await pool.execute(
                "SELECT COUNT(*) as total FROM modulos WHERE curso_id = ?",
                [curso.id]
            );
            const [completados] = await pool.execute(
                `SELECT COUNT(*) as total FROM progreso_usuario pu
                 JOIN modulos m ON pu.modulo_id = m.id
                 WHERE m.curso_id = ? AND pu.usuario_id = ? AND pu.completado = TRUE`,
                [curso.id, req.params.usuario_id]
            );
            const [inscrito] = await pool.execute(
                "SELECT id FROM inscripciones WHERE usuario_id = ? AND curso_id = ?",
                [req.params.usuario_id, curso.id]
            );

            cursosConProgreso.push({
                ...curso,
                total_modulos: modulos[0].total,
                modulos_completados: completados[0].total,
                inscrito: inscrito.length > 0
            });
        }
        res.json(cursosConProgreso);
    } catch (error) {
        console.error("Error al obtener cursos con progreso:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

app.post("/inscripcion", async (req, res) => {
    try {
        const { usuario_id, curso_id } = req.body;
        await pool.execute(
            "INSERT IGNORE INTO inscripciones (usuario_id, curso_id) VALUES (?, ?)",
            [usuario_id, curso_id]
        );
        res.json({ mensaje: "Inscripción exitosa" });
    } catch (error) {
        console.error("Error en inscripción:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

app.get("/modulos/:curso_id/:usuario_id", async (req, res) => {
    try {
        const [modulos] = await pool.execute(
            "SELECT id, curso_id, titulo, descripcion, orden FROM modulos WHERE curso_id = ? ORDER BY orden",
            [req.params.curso_id]
        );

        const modulosConProgreso = [];
        for (const mod of modulos) {
            const [prog] = await pool.execute(
                "SELECT completado, puntaje FROM progreso_usuario WHERE usuario_id = ? AND modulo_id = ?",
                [req.params.usuario_id, mod.id]
            );
            modulosConProgreso.push({
                ...mod,
                completado: prog.length > 0 ? prog[0].completado : false,
                puntaje: prog.length > 0 ? prog[0].puntaje : null
            });
        }
        res.json(modulosConProgreso);
    } catch (error) {
        console.error("Error al obtener módulos:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

app.get("/modulo/:modulo_id", async (req, res) => {
    try {
        const [rows] = await pool.execute(
            "SELECT * FROM modulos WHERE id = ?",
            [req.params.modulo_id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: "Módulo no encontrado" });
        }
        const mod = rows[0];
        mod.quiz = typeof mod.quiz === "string" ? JSON.parse(mod.quiz) : mod.quiz;
        res.json(mod);
    } catch (error) {
        console.error("Error al obtener módulo:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

app.post("/progreso", async (req, res) => {
    try {
        const { usuario_id, modulo_id, puntaje, total_preguntas } = req.body;
        const completado = puntaje >= 2;

        await pool.execute(
            `INSERT INTO progreso_usuario (usuario_id, modulo_id, puntaje, total_preguntas, completado)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE puntaje = VALUES(puntaje), completado = VALUES(completado), fecha = CURRENT_TIMESTAMP`,
            [usuario_id, modulo_id, puntaje, total_preguntas, completado]
        );

        res.json({ mensaje: completado ? "¡Módulo aprobado!" : "No aprobaste, intenta de nuevo", completado, puntaje });
    } catch (error) {
        console.error("Error al guardar progreso:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

app.get("/progreso/:usuario_id", async (req, res) => {
    try {
        const [rows] = await pool.execute(
            `SELECT pu.*, m.titulo as modulo_titulo, m.curso_id, c.titulo as curso_titulo, c.perfil
             FROM progreso_usuario pu
             JOIN modulos m ON pu.modulo_id = m.id
             JOIN cursos c ON m.curso_id = c.id
             WHERE pu.usuario_id = ?`,
            [req.params.usuario_id]
        );
        res.json(rows);
    } catch (error) {
        console.error("Error al obtener progreso:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

inicializarDB().then(() => {
        const portToUse = process.env.PORT || PORT;
        app.listen(portToUse, () => {
            console.log(`Servidor TecnoChilds corriendo en el puerto ${portToUse}`);
        });
});
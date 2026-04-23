const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs"); 

const app = express();
const db = new sqlite3.Database("./database.db");

app.use(express.json());






const frontendPath = path.resolve(__dirname, "../frontend");
app.use(express.static(frontendPath));





const sqlInit = fs.readFileSync(path.join(__dirname, "module.sql"), "utf8");
db.exec(sqlInit, (err) => {
    if (err) console.error("Error al cargar SQL:", err.message);
    else console.log("Tablas verificadas correctamente.");
});




app.post("/registro", (req, res) => {
    const { nombre, email, password, edad } = req.body;
    if (!nombre || !email || !password) return res.status(400).json({ error: "Datos incompletos" });

    const query = "INSERT INTO usuarios (nombre, email, password, edad) VALUES (?, ?, ?, ?)";
    db.run(query, [nombre, email, password, edad], function (err) {
        if (err) return res.status(500).json({ error: "El email ya existe." });
        res.json({ mensaje: "Usuario registrado con éxito", id: this.lastID });
    });
});

app.post("/login", (req, res) => {
    const { email, password } = req.body;
    db.get("SELECT * FROM usuarios WHERE email = ? AND password = ?", [email, password], (err, user) => {
        if (err) return res.status(500).json({ error: "Error en servidor" });
        if (!user) return res.status(401).json({ error: "Credenciales incorrectas" });
        res.json(user);
    });
});

app.get('/preguntas', (req, res) => {
    db.all('SELECT * FROM preguntas', (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get("/perfil/:id", (req, res) => {
    db.get("SELECT nombre, email, edad FROM usuarios WHERE id = ?", [req.params.id], (err, user) => {
        if (err || !user) return res.status(404).json({ error: "No encontrado" });
        res.json(user);
    });
});


app.post("/respuestas", (req, res) => {
    const respuestas = req.body; 
    
    if (!respuestas || respuestas.length === 0) {
        return res.status(400).json({ error: "No hay respuestas para guardar" });
    }

    const stmt = db.prepare("INSERT INTO respuestas (usuario_id, pregunta_id, respuesta) VALUES (?, ?, ?)");

   
    db.serialize(() => {
        respuestas.forEach(r => {
            stmt.run(r.usuario_id, r.pregunta_id, r.respuesta);
        });
        stmt.finalize();
        res.json({ mensaje: "Test guardado correctamente" });
    });
});

app.listen(4000, () => console.log("Servidor en http://localhost:4000"));
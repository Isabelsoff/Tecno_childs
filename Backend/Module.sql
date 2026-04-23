CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    edad INTEGER
);

CREATE TABLE IF NOT EXISTS preguntas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    texto TEXT NOT NULL,
    categoria TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS respuestas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    pregunta_id INTEGER NOT NULL,
    respuesta TEXT NOT NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (pregunta_id) REFERENCES preguntas(id)
);


INSERT OR IGNORE INTO preguntas (id, texto, categoria) VALUES (1, '¿Qué actividad disfrutas más en tu tiempo libre?', 'intereses');
INSERT OR IGNORE INTO preguntas (id, texto, categoria) VALUES (2, '¿Qué tipo de problemas te gusta resolver?', 'intereses');
INSERT OR IGNORE INTO preguntas (id, texto, categoria) VALUES (3, '¿Qué te motiva más: aprender, competir, crear o ayudar?', 'intereses');
INSERT OR IGNORE INTO preguntas (id, texto, categoria) VALUES (4, '¿Qué materias se te hacen más fáciles en la escuela?', 'habilidades');
INSERT OR IGNORE INTO preguntas (id, texto, categoria) VALUES (5, '¿Prefieres tareas manuales, creativas o analíticas?', 'habilidades');
INSERT OR IGNORE INTO preguntas (id, texto, categoria) VALUES (6, '¿Qué es más importante para ti?', 'valores');
INSERT OR IGNORE INTO preguntas (id, texto, categoria) VALUES (7, '¿Tienes acceso a internet y dispositivos para estudiar?', 'contexto');
INSERT OR IGNORE INTO preguntas (id, texto, categoria) VALUES (8, '¿Cómo te imaginas en 5 años?', 'proyeccion');
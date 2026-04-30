-- =============================================
-- TecnoChilds - Esquema de Base de Datos (MySQL)
-- =============================================

-- Crear la base de datos si no existe
CREATE DATABASE IF NOT EXISTS tecnochilds CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE tecnochilds;

-- -----------------------------------------
-- Tabla: usuarios
-- Almacena la información de cada usuario registrado.
-- -----------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    edad INT,
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------
-- Tabla: preguntas
-- Cada pregunta del test vocacional con sus opciones en formato JSON.
-- El campo "opciones" contiene un arreglo JSON donde cada opción
-- tiene un texto y un perfil asociado (cientifico, creativo, social, practico).
-- -----------------------------------------
CREATE TABLE IF NOT EXISTS preguntas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    texto VARCHAR(500) NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    opciones JSON NOT NULL
);

-- -----------------------------------------
-- Tabla: respuestas
-- Guarda cada respuesta individual del usuario.
-- "perfil" indica a qué perfil vocacional corresponde la opción elegida.
-- -----------------------------------------
CREATE TABLE IF NOT EXISTS respuestas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    pregunta_id INT NOT NULL,
    respuesta VARCHAR(500) NOT NULL,
    perfil VARCHAR(50),
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (pregunta_id) REFERENCES preguntas(id)
);

-- -----------------------------------------
-- Tabla: resultados
-- Almacena el análisis completo de cada test realizado.
-- "puntajes" es un JSON con los puntos por perfil.
-- "recomendaciones" es un JSON con las carreras sugeridas.
-- -----------------------------------------
CREATE TABLE IF NOT EXISTS resultados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    perfil_dominante VARCHAR(50) NOT NULL,
    puntajes JSON NOT NULL,
    recomendaciones JSON NOT NULL,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- -----------------------------------------
-- Insertar las 8 preguntas del test vocacional
-- Cada opción mapea a un perfil: cientifico, creativo, social o practico
-- -----------------------------------------
DELETE FROM preguntas;

INSERT INTO preguntas (id, texto, categoria, opciones) VALUES
(1, '¿Qué actividad disfrutas más en tu tiempo libre?', 'intereses',
 '[{"texto":"Leer, investigar o aprender cosas nuevas","perfil":"cientifico"},{"texto":"Dibujar, crear música o escribir historias","perfil":"creativo"},{"texto":"Hacer deporte o actividades al aire libre","perfil":"practico"},{"texto":"Ayudar a otros o trabajar en equipo","perfil":"social"}]'),

(2, '¿Qué tipo de problemas te gusta resolver?', 'intereses',
 '[{"texto":"Matemáticos o de lógica","perfil":"cientifico"},{"texto":"Creativos o de diseño","perfil":"creativo"},{"texto":"Técnicos o mecánicos","perfil":"practico"},{"texto":"De comunicación o relaciones","perfil":"social"}]'),

(3, '¿Qué te motiva más en la vida?', 'intereses',
 '[{"texto":"Aprender y descubrir cosas nuevas","perfil":"cientifico"},{"texto":"Crear e innovar","perfil":"creativo"},{"texto":"Construir y reparar","perfil":"practico"},{"texto":"Ayudar y enseñar a otros","perfil":"social"}]'),

(4, '¿Qué materias se te hacen más fáciles en la escuela?', 'habilidades',
 '[{"texto":"Matemáticas y ciencias","perfil":"cientifico"},{"texto":"Artes y música","perfil":"creativo"},{"texto":"Tecnología y computación","perfil":"practico"},{"texto":"Lenguaje, historia o ciencias sociales","perfil":"social"}]'),

(5, '¿Qué tipo de tareas prefieres?', 'habilidades',
 '[{"texto":"Analíticas: calcular, planificar, investigar","perfil":"cientifico"},{"texto":"Creativas: diseñar, inventar, imaginar","perfil":"creativo"},{"texto":"Manuales: construir, reparar, operar","perfil":"practico"},{"texto":"Sociales: enseñar, organizar, comunicar","perfil":"social"}]'),

(6, '¿Qué es más importante para ti en un trabajo?', 'valores',
 '[{"texto":"Resolver problemas complejos","perfil":"cientifico"},{"texto":"Expresar mi creatividad","perfil":"creativo"},{"texto":"Trabajar con herramientas o tecnología","perfil":"practico"},{"texto":"Ayudar a las personas","perfil":"social"}]'),

(7, '¿En qué ambiente te sentirías más cómodo trabajando?', 'contexto',
 '[{"texto":"En un laboratorio o centro de investigación","perfil":"cientifico"},{"texto":"En un estudio o taller creativo","perfil":"creativo"},{"texto":"En una fábrica, taller mecánico o al aire libre","perfil":"practico"},{"texto":"En una escuela, hospital o comunidad","perfil":"social"}]'),

(8, '¿Cómo te imaginas en 5 años?', 'proyeccion',
 '[{"texto":"Estudiando una carrera de ciencias o ingeniería","perfil":"cientifico"},{"texto":"Desarrollando proyectos artísticos o de diseño","perfil":"creativo"},{"texto":"Aprendiendo un oficio técnico o emprendiendo","perfil":"practico"},{"texto":"Trabajando ayudando a otras personas","perfil":"social"}]');
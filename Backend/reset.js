const mysql = require("mysql2/promise");

async function resetearTablas() {
    const pool = mysql.createPool({
        host: "localhost",
        user: "root",
        password: "120140213.s",
        database: "tecnochilds",
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

    try {
        console.log("Conectado. Reseteando tablas de cursos...");
        await pool.execute("SET FOREIGN_KEY_CHECKS = 0;");
        await pool.execute("TRUNCATE TABLE progreso_usuario;");
        await pool.execute("TRUNCATE TABLE inscripciones;");
        await pool.execute("TRUNCATE TABLE modulos;");
        await pool.execute("TRUNCATE TABLE cursos;");
        await pool.execute("SET FOREIGN_KEY_CHECKS = 1;");
        console.log("Tablas vaciadas. Ahora reinicia el Server.js para que inserte los nuevos datos.");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

resetearTablas();

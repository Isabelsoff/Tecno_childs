
function mostrar(seccion) {
    
    document.querySelectorAll(".seccion-pantalla").forEach(div => {
        div.style.display = "none";
    });

   
    const seccionActiva = document.getElementById(seccion);
    if (seccionActiva) {
        seccionActiva.style.display = "block";
    }

    
    if (seccion === "testVocacional") cargarPreguntas();
    if (seccion === "perfil") cargarPerfil();
}

function registrar() {
    const datos = {
        nombre: document.getElementById("nombre").value,
        email: document.getElementById("email").value,
        password: document.getElementById("password").value,
        edad: document.getElementById("edad").value
    };

    fetch("/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos)
    })
    .then(res => res.json())
    .then(data => {
        if (data.error) alert(data.error);
        else {
            alert(data.mensaje);
            mostrar('login'); 
        }
    });
}

function login() {
    const email = document.getElementById("emailLogin").value;
    const password = document.getElementById("passwordLogin").value;

    fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    })
    .then(res => res.json())
    .then(user => {
        if (user.error) alert(user.error);
        else {
            localStorage.setItem("usuarioId", user.id);
            localStorage.setItem("usuarioNombre", user.nombre);
            alert("¡Bienvenido " + user.nombre + "!");
            mostrar('perfil'); 
        }
    })
    .catch(() => alert("Error al conectar con el servidor"));
}

function cargarPerfil() {
    const id = localStorage.getItem("usuarioId");
    if (!id) return mostrar('login');

    fetch("/perfil/" + id)
        .then(res => res.json())
        .then(user => {
            const contenedor = document.getElementById("infoPerfil");
            contenedor.innerHTML = `
                <div class="card-perfil">
                    <h3>Hola, ${user.nombre}</h3>
                    <p><strong>Correo:</strong> ${user.email}</p>
                    <p><strong>Edad:</strong> ${user.edad} años</p>
                </div>
            `;
        });
}

function cargarPreguntas() {
    fetch("/preguntas")
        .then(res => res.json())
        .then(preguntas => {
            const contenedor = document.getElementById("contenedorPreguntas");
            contenedor.innerHTML = ""; 

            preguntas.forEach((p) => {
                const div = document.createElement("div");
                div.className = "pregunta-bloque"; 
                div.innerHTML = `
                    <p><strong>${p.texto}</strong></p>
                    <input type="text" id="pregunta_${p.id}" class="inputPregunta" placeholder="Escribe tu respuesta aquí">
                    <hr>
                `;
                contenedor.appendChild(div);
            });
        })
        .catch(err => console.error("Error al cargar preguntas:", err));
}

function enviarRespuestas() {
    const usuarioId = localStorage.getItem("usuarioId");

    if (!usuarioId) {
        alert("Debes iniciar sesión para guardar el test");
        return mostrar('login');
    }

    const inputs = document.querySelectorAll(".inputPregunta");
    const respuestas = [];

    inputs.forEach(input => {
        const pregunta_id = input.id.split("_")[1];
        const respuesta = input.value;

        if (respuesta.trim() !== "") { 
            respuestas.push({
                usuario_id: usuarioId,
                pregunta_id: parseInt(pregunta_id),
                respuesta: respuesta
            });
        }
    });

    if (respuestas.length === 0) {
        return alert("Por favor, responde al menos una pregunta.");
    }

    fetch("/respuestas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(respuestas)
    })
    .then(res => res.json())
    .then(data => {
        alert("¡Test enviado correctamente! Pronto verás tus resultados.");
        mostrar('perfil')
    })
    .catch(err => alert("Error al guardar respuestas"));
}
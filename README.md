# TecnoChilds

Plataforma web de orientación vocacional para jóvenes. Ayuda a descubrir el perfil profesional de cada usuario a través de un test vocacional con análisis automático de resultados.

## Tecnologías

| Componente | Tecnología |
|------------|------------|
| Frontend | HTML5, CSS3, JavaScript (Vanilla) |
| Backend | Node.js + Express 5 |
| Base de datos | MySQL |
| Seguridad | bcrypt (hash de contraseñas) |

## Funcionalidades

- Registro e inicio de sesión con contraseñas encriptadas
- Test vocacional de 8 preguntas con opciones múltiples
- Análisis automático de 4 perfiles vocacionales (Científico, Creativo, Social, Práctico)
- Resultados visuales con barras de puntaje y carreras recomendadas
- Historial de tests anteriores
- Diseño responsivo y premium con glassmorphism

## Perfiles Vocacionales

| Perfil | Descripción | Carreras sugeridas |
|--------|-------------|-------------------|
| Científico-Tecnológico | Mente analítica y curiosa | Ingeniería, Medicina, Programación |
| Artístico-Creativo | Imaginación y sensibilidad artística | Diseño Gráfico, Arquitectura, Cine |
| Social-Humanístico | Empatía y vocación de servicio | Psicología, Educación, Derecho |
| Práctico-Técnico | Hábil con la tecnología y las manos | Mecatrónica, Electrónica, Gastronomía |

## Instalación

1. Clonar el repositorio:
```bash
git clone https://github.com/Isabelsoff/Tecno_childs.git
cd Tecno_childs
```

2. Instalar dependencias del backend:
```bash
cd Backend
npm install
```

3. Configurar MySQL:
   - Tener MySQL corriendo en localhost
   - Editar `Backend/Server.js` con tu usuario y contraseña de MySQL

4. Iniciar el servidor:
```bash
npm start
```

5. Abrir en el navegador: [http://localhost:4000](http://localhost:4000)

## Estructura del Proyecto

```
Tecno_childs/
├── Backend/
│   ├── Server.js          # Servidor Express + API REST
│   ├── Module.sql          # Esquema de base de datos MySQL
│   └── package.json        # Dependencias del backend
├── Frontend/
│   ├── index.html          # Página principal (SPA)
│   ├── app.js              # Lógica del frontend
│   ├── style.css           # Estilos premium
│   └── Img/                # Imágenes y banner
├── .gitignore
└── README.md
```

## Autores

- **Isabel** — [@Isabelsoff](https://github.com/Isabelsoff)
- **Samuel Giraldo** — [@SamuelGiraldo1](https://github.com/SamuelGiraldo1)

## Licencia

Proyecto académico — Universidad de Antioquia, 2026.

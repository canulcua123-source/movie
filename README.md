# 🎬 CineNoir - Movie App

Aplicación web completa para gestión de películas con sistema de reseñas, favoritos y panel de administración.

## 🚀 Tecnologías

### Frontend
- **Angular 18** - Framework principal
- **TypeScript** - Lenguaje de programación
- **SCSS** - Estilos
- **Angular Router** - Navegación
- **HttpClient** - Peticiones HTTP

### Backend
- **Node.js** - Runtime
- **Express** - Framework web
- **Supabase** - Base de datos PostgreSQL y autenticación
- **JWT** - Autenticación con tokens

## 📦 Estructura del Proyecto

```
coding/
├── frontend/          # Aplicación Angular
│   ├── src/
│   │   ├── app/
│   │   │   ├── pages/        # Páginas de la aplicación
│   │   │   ├── interceptors/ # Interceptores HTTP
│   │   │   └── ...
│   └── package.json
│
├── backend/           # API REST con Express
│   ├── src/
│   │   ├── controllers/  # Lógica de negocio
│   │   ├── middleware/   # Middlewares (auth, ban check)
│   │   ├── routes/       # Definición de rutas
│   │   └── config/       # Configuración (Supabase)
│   ├── scripts/          # Scripts SQL
│   └── package.json
│
└── README.md
```

## 🔧 Instalación

### 1. Clonar el repositorio

```bash
git clone <tu-repo-url>
cd coding
```

### 2. Configurar Backend

```bash
cd backend
npm install
```

Crear archivo `.env` con tus credenciales de Supabase:

```env
SUPABASE_URL=tu_supabase_url
SUPABASE_ANON_KEY=tu_supabase_anon_key
SUPABASE_SERVICE_KEY=tu_supabase_service_key
JWT_SECRET=tu_jwt_secret
PORT=3000
```

### 3. Configurar Base de Datos

Ejecuta los scripts SQL en Supabase SQL Editor en este orden:

1. `backend/scripts/schema.sql` - Crear tablas
2. `backend/scripts/insert-movies.sql` - Insertar películas de ejemplo (opcional)

### 4. Configurar Frontend

```bash
cd ../frontend
npm install
```

## 🚀 Ejecutar en Desarrollo

### Backend
```bash
cd backend
npm run dev
```
El servidor estará en `http://localhost:3000`

### Frontend
```bash
cd frontend
npm start
```
La aplicación estará en `http://localhost:4200`

## 📱 Características

### Para Usuarios
- ✅ Registro e inicio de sesión
- ✅ Explorar catálogo de películas
- ✅ Filtrar por género y búsqueda
- ✅ Ver detalles de películas
- ✅ Agregar/quitar favoritos
- ✅ Escribir, editar y eliminar reseñas
- ✅ Ver perfil de usuario

### Para Administradores
- ✅ Panel de administración
- ✅ Dashboard con estadísticas
- ✅ CRUD completo de películas
- ✅ Gestión de usuarios
- ✅ Cambiar roles de usuarios
- ✅ Banear/desbanear usuarios

## 🔐 Roles de Usuario

- **user** - Usuario regular con acceso a funciones básicas
- **admin** - Administrador con acceso completo al panel de administración

## 🛡️ Seguridad

- Autenticación con JWT
- Middleware de verificación de ban
- Protección de rutas en frontend y backend
- Validación de permisos por rol

## 📝 API Endpoints

### Autenticación
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Inicio de sesión

### Películas
- `GET /api/movies` - Listar películas
- `GET /api/movies/:id` - Detalle de película
- `POST /api/movies` - Crear película (admin)
- `PUT /api/movies/:id` - Actualizar película (admin)
- `DELETE /api/movies/:id` - Eliminar película (admin)

### Reseñas
- `GET /api/reviews/movie/:movieId` - Reseñas de una película
- `POST /api/reviews/movie/:movieId` - Crear reseña (auth)
- `PUT /api/reviews/:id` - Actualizar reseña (auth)
- `DELETE /api/reviews/:id` - Eliminar reseña (auth)

### Favoritos
- `GET /api/favorites/me` - Mis favoritos (auth)
- `POST /api/favorites/movie/:movieId` - Agregar favorito (auth)
- `DELETE /api/favorites/movie/:movieId` - Quitar favorito (auth)

### Admin
- `GET /api/admin/dashboard` - Estadísticas (admin)
- `GET /api/admin/users` - Listar usuarios (admin)
- `PUT /api/admin/users/:id/role` - Cambiar rol (admin)
- `PUT /api/admin/users/:id/ban` - Banear/desbanear (admin)

## 🎨 Capturas de Pantalla

_Agrega capturas de pantalla de tu aplicación aquí_

## 👨‍💻 Autor

**Tu Nombre**

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

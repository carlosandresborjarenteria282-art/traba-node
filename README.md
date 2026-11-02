# Catálogo de productos

Aplicación full-stack de catálogo de productos con Node.js, Express, JWT y persistencia en archivo JSON.

## Instalación

```bash
npm install
```

## Variables de entorno

Copia `.env` y ajusta si lo necesitas (ya incluido):

```env
PORT=3000
HOST=localhost
NODE_ENV=development

JWT_SECRET=cambia_este_secreto_por_uno_largo_y_aleatorio
JWT_EXPIRES_IN=1h

DB_PATH=./data/catalogo.json

ADMIN_USER=admin
ADMIN_PASSWORD=123456
```

## Ejecución

```bash
npm start        # producción
npm run dev      # desarrollo (nodemon)
npm run db:reset # reiniciar base de datos
npm run db:inspect # inspeccionar base de datos
npm run smoke    # pruebas automáticas (servidor debe estar arriba)
```

Servidor: `http://localhost:3000`

## Credenciales de prueba

- Usuario: `admin`
- Contraseña: `123456`
- Rol: `admin`

También puedes registrarte desde la pantalla de login (pestaña "Registrarse").
Los usuarios registrados obtienen rol `admin` para poder usar el CRUD completo.

## Endpoints

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/api/health` | Público | Estado de la API |
| POST | `/api/auth/login` | Público | Login y token |
| POST | `/api/auth/register` | Público | Registro de usuario |
| PUT | `/api/auth/password` | JWT | Cambiar contraseña |
| GET | `/api/productos` | Público | Listar y buscar (`?buscar=`, `?categoria=`) |
| GET | `/api/productos/estadisticas` | Público | Indicadores |
| GET | `/api/productos/:id` | Público | Detalle |
| POST | `/api/productos` | JWT + admin | Crear |
| PUT | `/api/productos/:id` | JWT + admin | Actualizar |
| DELETE | `/api/productos/:id` | JWT + admin | Eliminar |

## Frontend

- `http://localhost:3000/` — Login
- `http://localhost:3000/productos.html` — Panel

## Estructura

Ver sección 3 de `GUIA_IMPLEMENTACION.md`.
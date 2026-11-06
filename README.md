# SADU Backend — Sistema Administrativo Documental Unificado

API REST de SADU, el sistema de gestión documental para la Alcaldía Municipal de San Antonio del Tequendama.
Proyecto formativo del programa Análisis y Desarrollo de Software (SENA, ficha 3186583).

- **Tecnologías:** Node.js, Express 5, MySQL (mysql2), JWT, bcryptjs, Multer, PDFKit.
- **Frontend que la consume:** [sadu-frontend](https://github.com/nerites584-beep/sadu-frontend)

## 1. Requisitos

- Node.js 20 o superior
- MySQL 8 (por ejemplo, el de XAMPP)

## 2. Instalación

```bash
git clone https://github.com/nerites584-beep/sadu-backend.git
cd sadu-backend
npm install
```

1. Cree la base de datos ejecutando `database.sql` en MySQL.
2. Copie `app/config/environments/developer.env.example` como `developer.env` y complete los valores.
3. Inicie el servidor:

```bash
npm run dev     # desarrollo, se reinicia solo al guardar
npm start       # ejecución normal
```

Si falta una variable obligatoria (`PORT`, `DB_HOST`, `DB_USER`, `DB_NAME`, `JWT_SECRET`) el servidor
no arranca y muestra cuál falta.

## 3. Estructura del proyecto

```
app/
  config/        conexión a la base de datos, migraciones, catálogos y variables de entorno
  controllers/   lógica de cada módulo (documentos, usuarios, reportes, catálogos, auditoría)
  middlewares/   autenticación JWT, autorización por roles, subida de PDF y seguridad
  routes/        definición de los endpoints
  utils/         validaciones, seguridad, errores, filtros, reportes y auditoría
test/            pruebas unitarias (node:test)
database.sql     script de creación de la base de datos
```

## 4. Endpoints principales

| Método | Ruta | Rol requerido |
|---|---|---|
| POST | `/login` | Público |
| GET | `/documento`, `/documento/:id` | Cualquier usuario autenticado |
| POST, PATCH | `/documento`, `/documento/:id` | Administrador, Funcionario |
| DELETE | `/documento/:id` | Administrador |
| POST, GET | `/documento/:id/archivo` | Administrador, Funcionario |
| GET | `/reporte`, `/reporte/exportar` | Autenticado / Administrador, Funcionario |
| CRUD | `/usuario` | Administrador |
| GET, POST, PATCH | `/catalogo` | Autenticado (consulta) / Administrador |
| GET | `/auditoria` | Administrador |
| GET | `/salud` | Público (estado del servicio) |

## 5. Pruebas

```bash
npm test
```

Las pruebas unitarias cubren validaciones, seguridad (bcrypt y JWT), límite de intentos de inicio de sesión,
filtros, reportes, documentos cerrados, manejo de errores, cabeceras de seguridad y verificación del entorno.
Se ejecutan también de forma automática en GitHub Actions con cada `push` (ver `.github/workflows/pruebas.yml`).

## 6. Proceso de calidad del equipo

**Ramas.** `main` siempre debe funcionar. Cada cambio se hace en una rama propia y se integra con un merge:

- `feature/<nombre>` para funciones nuevas
- `fix/<nombre>` para corrección de errores

**Mensajes de commit.** Se usa el formato `tipo(módulo): descripción en español`:

| Tipo | Uso |
|---|---|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de un error |
| `test` | Pruebas unitarias |
| `docs` | Documentación |
| `chore` | Configuración o mantenimiento |
| `merge` | Integración de una rama a `main` |

**Antes de integrar una rama a `main`** se revisa la lista de chequeo de `.github/pull_request_template.md`:
las pruebas pasan, las entradas se validan, los endpoints exigen el rol correcto y no se suben archivos `.env`.

**Seguridad.**
- Contraseñas cifradas con bcrypt; sesiones con JWT que vencen en 8 horas.
- Bloqueo de 15 minutos después de 5 intentos fallidos de inicio de sesión.
- Consultas SQL parametrizadas (`?`) para evitar inyección SQL.
- Cabeceras HTTP de seguridad y sin la cabecera `X-Powered-By`.
- En producción (`NODE_ENV=production`) los errores no muestran detalles técnicos al cliente.
- Las acciones importantes quedan en la bitácora de auditoría.

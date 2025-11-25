
# Space Journey (space-journey)

Servidor ligero para la demo "Space Journey" — sirve los archivos estáticos en `public/` y expone una ruta de configuración (`/config`). Este repositorio contiene el backend mínimo en `server.js` y una pequeña UI en `public/`.

## Descripción

Proyecto demostrativo que muestra una app estática (frontend) servida por un servidor Express sencillo. Incluye:

- Frontend en `public/` (`index.html`, `app.js`, `styles.css`).
- Endpoint `/config` que devuelve `config.json`.

## Características

- Servidor estático con Express.
- Carga de configuración desde `config.json`.
- Fácil de ejecutar y personalizar.

## Requisitos

- Node.js (v14+ recomendable)
- npm

## Instalación

Desde la raíz del proyecto:

```powershell
npm install
```

## Configuración

- El puerto por defecto es `3000`. Se puede cambiar con la variable de entorno `PORT` o creando un archivo `.env` con `PORT=xxxx`.

Ejemplo (PowerShell):

```powershell
$env:PORT=4000; npm start
```

O editar `config.json` según necesites.

## Ejecutar

Usa el script definido en `package.json`:

```powershell
npm start
# o directamente
node server.js
```

Luego abre `http://localhost:3000` (o el puerto que hayas configurado).

## Estructura del proyecto

- `server.js` - servidor Express que sirve `public/` y expone `/config`.
- `public/` - frontend estático (HTML, JS, CSS).
- `config.json` - configuración que el servidor devuelve en `/config`.
- `package.json` - metadatos y scripts.

## Contribuir

1. Haz un fork.
2. Crea una rama: `git checkout -b feature/mi-cambio`.
3. Haz tus cambios y añade tests si aplica.
4. Envía un pull request describiendo tu cambio.

## Licencia

Este proyecto usa una licencia no comercial.

---

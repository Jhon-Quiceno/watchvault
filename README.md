<p align="center">
  <img src="./public/logo.svg" alt="Logo de Watchvault" width="88" height="88" />
</p>

<h1 align="center">Watchvault</h1>

<p align="center"><strong>Todo tu historial de películas, series y anime — en un solo vault personal y rápido.</strong></p>

<p align="center">
  🎬 <strong><a href="https://watchvault-demo.vercel.app">Probá la demo en vivo</a></strong> — acá podés ver la aplicación funcionando sin necesidad de instalar nada.
</p>

Watchvault es un tracker autoalojado para todo lo que ves. Buscá en TMDB y AniList, mirá el detalle completo antes de decidirte, agregalo con el estado correcto en un solo paso, y dejá que tu dashboard, tus estadísticas y las recomendaciones hagan el resto. Sin cuentas, sin feed social, sin ruido — solo tu biblioteca, pensada para ser rápida.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwindcss)](https://tailwindcss.com)
[![Deploy with Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://vercel.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

<!--
  Agregar screenshots/GIFs reales acá — el dashboard, la búsqueda con el
  detalle abierto, y la grilla de biblioteca son las tres vistas más visuales.
  ![Dashboard](./docs/screenshots/dashboard.png)
-->

---

## ✨ Funcionalidades

### Descubrí sin comprometerte
- **Búsqueda unificada** en **TMDB** (películas y series) y **AniList** (anime), agrupada y filtrable por tipo, con resultados que aparecen mientras escribís.
- **Vista de detalle completa antes de agregar** — poster, sinopsis, elenco, géneros, duración, tráiler y dónde verla. Decidís con información real, no solo con una miniatura.
- **Agregá con el estado correcto en un clic** — elegí *Viendo*, *Completado*, *Por ver*, *En pausa*, *Abandonado* o *Reviendo* directamente desde el resultado de búsqueda o el diálogo de detalle; se guarda tal cual lo indicás, sin un paso extra de edición después.
- **Detección de duplicados** — los títulos que ya están en tu vault se marcan claramente donde sea que aparezcan en la búsqueda, para que nunca agregues lo mismo dos veces.
- **"Dónde ver"** — disponibilidad en plataformas de streaming, tomada directo de los proveedores y mostrada en la vista de detalle.

### No perdás de vista lo que estás viendo
- **Dashboard** con estanterías inteligentes (*Continúa viendo*, *Agregados recientemente*, *Favoritos*, *Por ver*) y estadísticas de un vistazo (títulos, horas vistas, calificación promedio, favoritos).
- **Próximos episodios** — un widget en vivo que trae datos frescos de episodios para todo lo que estás siguiendo activamente y te dice qué sale hoy, mañana, o salió hace poco, para que no se te pase nada.

### Organizalo a tu manera
- **Gestión completa de biblioteca** — estado, calificación personal, favoritos, notas, etiquetas, fechas de inicio/fin, episodios/temporadas vistas, cantidad de rewatches.
- **Acciones masivas** — seleccioná varias entradas a la vez para cambiar el estado o quitarlas, con confirmación antes de cualquier acción destructiva.
- **Listas personalizadas** para agrupar títulos como quieras.
- **Filtros y ordenamiento potentes** en toda la biblioteca.
- **Importar/exportar** tu biblioteca como JSON — tus datos siempre son portables.

### Entendé tus hábitos
- **Página de estadísticas** con mapa de calor de actividad y desgloses por tipo, estado y calificación.
- **Recomendaciones** generadas localmente en base a tu propio gusto — sin API externa de recomendaciones, sin que tus datos salgan de tu vault.

### Pensada para sentirse nativa
- **Command palette** (`⌘K` / `Ctrl+K`) para ir a cualquier lado al instante.
- **Tema claro/oscuro**, totalmente responsive de celular a pantalla ultrawide — con un drawer de navegación mobile de verdad, grillas adaptables y controles pensados para tocar con el dedo.

### Tuya, y compartible en tus términos
- **Contraseña opcional** — protegé tu biblioteca real detrás de un login con una sola variable de entorno; desactivada por defecto.
- **Modo demo público de solo lectura** — corré un segundo deploy con datos de ejemplo para que la gente pruebe la app sin tocar nunca tu biblioteca real ni tus credenciales. [Mirá la demo acá](https://watchvault-demo.vercel.app).

---

## 🧱 Stack tecnológico

| Capa | Elección |
|---|---|
| Framework | [Next.js 15](https://nextjs.org) — App Router, TypeScript, Turbopack |
| Estilos | [Tailwind CSS v4](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com) (sobre [Base UI](https://base-ui.com)) |
| Estado del servidor | [TanStack Query](https://tanstack.com/query) |
| Estado del cliente | [Zustand](https://zustand-demo.pmnd.rs) |
| Formularios y validación | [React Hook Form](https://react-hook-form.com) + [Zod](https://zod.dev) |
| HTTP | [Axios](https://axios-http.com) |
| Animaciones | [Framer Motion](https://www.framer.com/motion) |
| Proveedores de metadata | [TMDB](https://www.themoviedb.org/documentation/api) (películas/series) · [AniList](https://anilist.gitbook.io/anilist-apiv2-docs/) (anime, GraphQL) |
| Persistencia | [Vercel Blob](https://vercel.com/docs/vercel-blob) en producción · archivo JSON local en desarrollo |

## 🏗️ Arquitectura

Watchvault está construida sobre unos pocos límites deliberados para que sea fácil de extender:

```
src/
  app/                  Rutas, layout y providers del App Router de Next.js
  components/ui/        Primitivas generadas por shadcn/ui
  components/shared/    Componentes reutilizables entre features
  components/layout/    App shell (nav, header, drawer mobile)
  features/             Una carpeta por área de funcionalidad (library, search,
                         dashboard, stats, lists, profile, recommendations)
  server/providers/     Adaptadores de TMDB / AniList detrás de una interfaz
                         común `MetadataProvider` — agregar una fuente nueva
                         es implementar una interfaz
  server/repositories/  Persistencia detrás de una interfaz
                         `LibraryRepository` — backend de storage
                         intercambiable sin tocar el resto de la app
  lib/                  Utilidades transversales (cliente API, query client)
  hooks/                Hooks de React compartidos
  stores/               Stores de Zustand
  types/                Tipos de dominio — el límite anti-corrupción que
                         normaliza los datos de TMDB/AniList a una sola forma
  config/                Configuración solo de servidor (validación de env)
```

- **Abstracción de proveedores**: cada fuente externa de metadata implementa la misma interfaz `MetadataProvider`, así que los resultados de búsqueda y detalle siempre vuelven con la misma forma normalizada, sin importar de dónde vengan.
- **Abstracción de repositorio**: la biblioteca se lee/escribe a través de una interfaz `LibraryRepository`. En local es un archivo JSON plano; en producción es Vercel Blob con escrituras de concurrencia optimista. Migrar a una base relacional más adelante toca solo ese límite, nada más.

---

## 🚀 Cómo empezar

Este proyecto usa **pnpm**.

```bash
pnpm install
cp .env.example .env.local   # después completá TMDB_API_KEY
pnpm dev
```

Abrí [http://localhost:3000](http://localhost:3000).

### Variables de entorno

| Variable | Requerida | Dónde | Para qué sirve |
|---|---|---|---|
| `TMDB_API_KEY` | Sí | Local + Producción | Habilita la búsqueda y el detalle de películas/series vía TMDB. [Conseguí una key gratis](https://www.themoviedb.org/settings/api). |
| `BLOB_READ_WRITE_TOKEN` | Solo producción | Vercel (se inyecta sola) | Permite que la app lea/escriba tu biblioteca en Vercel Blob. No hace falta en local — el desarrollo cae automáticamente a un archivo JSON local. |
| `TMDB_API_BASE_URL` | No | — | Sobrescribe la URL base de la API de TMDB. Por defecto usa el endpoint oficial. |
| `ANILIST_GRAPHQL_URL` | No | — | Sobrescribe el endpoint GraphQL de AniList. Por defecto usa el endpoint oficial. |
| `SITE_PASSWORD` | No | Producción (opcional) | Bloquea toda la app detrás de un login cuando está configurada. Desactivada por defecto — sin auth, igual que en local. |
| `NEXT_PUBLIC_DEMO_MODE` | No | Solo en el deploy de la demo pública | Poné `true` para servir datos de muestra de solo lectura en vez de tu biblioteca real — ver [`DEPLOYMENT.md`](./DEPLOYMENT.md). |

La búsqueda de anime vía AniList no necesita ninguna API key.

## 📜 Scripts

- `pnpm dev` — inicia el servidor de desarrollo (Turbopack)
- `pnpm build` — build de producción
- `pnpm start` — corre un build de producción en local
- `pnpm lint` — corre ESLint

## ☁️ Deploy

Watchvault está pensada para desplegarse directo en [Vercel](https://vercel.com). Mirá [`DEPLOYMENT.md`](./DEPLOYMENT.md) para el paso a paso completo: subir a GitHub, crear el store de Vercel Blob, configurar las variables de entorno, proteger tu app real con contraseña, crear un deploy de demo pública, y salir a producción.

## 📄 Licencia

[MIT](./LICENSE) — hacé lo que quieras con esto.

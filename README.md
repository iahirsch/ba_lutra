# Lutra - train.grow.connect

An interactive exhibit installation where visitors create and customise a personal otter companion ("Lutra"), complete a treadmill workout tracked via Strava, and watch their physical effort restore a 3D virtual world.

## How it works

A visitor sits at a tablet (the **creator view**) and is guided through a dialogue flow with their Lutra. In parallel, the companion is rendered on a large display (the **hub view**). After customising their companion and completing a treadmill session, the effort score from Strava is converted into in-world energy that triggers the vegetation growth.

## Architecture

| Layer    | Technology                                                              |
| -------- | ----------------------------------------------------------------------- |
| Frontend | React 19, Three.js / React Three Fiber, Zustand, Vite, Socket.io client |
| Backend  | NestJS 11, TypeORM, PostgreSQL, Socket.io (WebSockets), Swagger         |
| Monorepo | Nx 22                                                                   |

**Pages**

- `/editor` — 3D companion customisation (fur colour, eye colour, nose colour, body morphs, clothing, backpack)
- `/hub` — multi-companion 3D scene showing all saved Lutras
- `/interaction` — guided dialogue flow between the tablet (editor) and the big screen (companion), including Strava activity start/finish
- `/admin` — activity summaries and list of saved companions

**Backend modules**

- `companion` — CRUD for companions, WebSocket gateway for the real-time flow
- `activity` — stores Strava activities, computes effort scores
- `strava` — OAuth callback and webhook receiver

## Prerequisites

- Docker and Docker Compose (for the dev container and PostgreSQL)
- A Strava API application (client ID, client secret, access/refresh tokens)
- Node.js 24 (handled automatically inside the dev container)

## Setup

### 1. Start the dev container

Open the project in a Code Editor and reopen in container, or start the services manually:

```sh
docker compose -f .devcontainer/docker-compose.yml up -d
npm install
```

### .env File

| Variable                      | Description                                                               |
| ----------------------------- | ------------------------------------------------------------------------- |
| `DATABASE_HOST`               | PostgreSQL host (default: `localhost`)                                    |
| `DATABASE_PORT`               | PostgreSQL port (default: `5432`)                                         |
| `DATABASE_USER`               | PostgreSQL user                                                           |
| `DATABASE_PASSWORD`           | PostgreSQL password (see `.devcontainer/postgres_password.txt`)           |
| `DATABASE_NAME`               | Database name (default: `lutra_db`)                                       |
| `DATABASE_SSL`                | Enable SSL (`true` / `false`)                                             |
| `STRAVA_CLIENT_ID`            | Strava app client ID                                                      |
| `STRAVA_CLIENT_SECRET`        | Strava app client secret                                                  |
| `STRAVA_ACCESS_TOKEN`         | Strava access token                                                       |
| `STRAVA_REFRESH_TOKEN`        | Strava refresh token                                                      |
| `STRAVA_REDIRECT_URI`         | OAuth callback URL (default: `http://localhost:3000/api/strava/callback`) |
| `STRAVA_WEBHOOK_VERIFY_TOKEN` | Random secret string for Strava webhook verification                      |
| `FRONTEND_URL`                | Frontend origin for CORS (default: `http://localhost:4200`)               |

### 3. Run database migrations

```sh
npm run migration:run
```

## Running locally

Start both applications in separate terminals:

```sh
# Backend — http://localhost:3000
npx nx serve backend

# Frontend — http://localhost:4200
npx nx serve frontend
```

Swagger API docs are available at `http://localhost:3000/api`.

## Database migrations

| Command                      | Description                                  |
| ---------------------------- | -------------------------------------------- |
| `npm run migration:run`      | Apply all pending migrations                 |
| `npm run migration:revert`   | Revert the last migration                    |
| `npm run migration:show`     | List applied and pending migrations          |
| `npm run migration:generate` | Generate a new migration from entity changes |

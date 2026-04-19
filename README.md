# Gradious Career Portal

Monorepo for a career portal with role-based flows for **candidates**, **recruiters**, and **admins**: job listings, applications, notifications, and email (invites, password reset, application confirmations).

## Repository layout

| Path | Role |
|------|------|
| `career-portal-backend/` | Express API (MySQL), JWT auth, file uploads, mail |
| `career-portal-react/` | React (CRA) SPA used as the main modern UI |
| `career-portal-frontend/` | Legacy static frontend; the API can still serve these files from `career-portal-backend` |

## Prerequisites

- Node.js (LTS recommended)
- MySQL with a database matching your `.env` (see below)

## Backend (`career-portal-backend`)

From the backend folder:

```bash
cd career-portal-backend
npm install
npm run dev
```

The API listens on **http://localhost:5000** (see `src/index.js`). Routes are mounted under `/api/*` (for example `/api/auth`, `/api/jobs`).

### Environment variables

Create a `.env` in `career-portal-backend` (do not commit secrets). Typical keys:

| Variable | Purpose |
|----------|---------|
| `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | MySQL connection |
| `JWT_SECRET` | Signing JWTs (use a strong value in production) |
| `FRONTEND_URL` | Base URL for links in emails (reset password, recruiter invite) |
| `EMAIL_USER`, `EMAIL_PASS` | SMTP credentials for `sendMail` |
| `MAIL_FROM_DISPLAY` | Optional “from” display name |
| `SUPPORT_EMAIL` or `SUPPORT_CONTACT_EMAIL` | Shown in application confirmation emails |
| `NODE_ENV` | `production` tightens default logging (see below) |
| `LOG_LEVEL` | Optional override: `error`, `warn`, `info`, or `debug` |

## Frontend (`career-portal-react`)

From the React app folder:

```bash
cd career-portal-react
npm install
npm start
```

The dev server runs on **http://localhost:3000**. API calls are configured in `src/services/api.js` (default base URL `http://localhost:5000/api`). Adjust there or via env if your API host differs.

## Logging

### API (`career-portal-backend`)

- Use `const logger = require("./utils/logger");` (path relative to each file) instead of raw `console.*`.
- Messages are prefixed with **`[gradious-api]`** and a level tag.
- **Defaults:** `NODE_ENV=production` → minimum level **info** (debug is hidden). Non-production → **debug** and above.
- Override with **`LOG_LEVEL=error|warn|info|debug`**.
- Avoid logging passwords, full tokens, or full `req.body` in production; prefer IDs and safe metadata.

### React app (`career-portal-react`)

- Use `import logger from "./utils/logger";` (adjust path from the calling file).
- Prefix **`[gradious-app]`**; in **production** builds only **warn** and **error** are printed to the browser console.

## Scripts note

`career-portal-backend/package.json` includes a `start` script that references sibling folders; for local development the usual commands are **`npm run dev`** in the backend and **`npm start`** in the React app in two terminals.

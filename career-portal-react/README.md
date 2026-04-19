# Gradious Career Portal — React app

This is the Create React App front end for the Gradious Career Portal. It talks to the Express API under `/api` (see `src/services/api.js`).

## Run locally

```bash
npm install
npm start
```

Opens at [http://localhost:3000](http://localhost:3000). Ensure the backend is running (default API: [http://localhost:5000](http://localhost:5000)).

## Build

```bash
npm run build
```

## Logging

Use `src/utils/logger.js` instead of scattered `console.*` calls so messages are prefixed and production noise is reduced. See the repository [README.md](../README.md) for full project layout, env vars, and API logging.

## CRA reference

Standard Create React App topics (testing, eject, deployment) are documented at [https://create-react-app.dev/](https://create-react-app.dev/).

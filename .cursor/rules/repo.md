Project: Amplify (monorepo: backend + frontend + shared)

Stack overview

- Backend: Node.js + Express + TypeScript (ts-node-dev for dev, tsc build). MongoDB via Mongoose. Stripe, AWS S3, Nodemailer. Socket.IO integrated on the HTTP server.
- Frontend: Next.js 15 (App Router, React 19), Tailwind CSS 4, TypeScript, TanStack Query, Axios.
- Shared: TypeScript project references used to share types between backend and frontend.

Runtime requirements

- Use Node.js 20 LTS.
- Package managers: npm (repo uses package-lock.json).

Repository layout

- backend/: Express API, TypeScript sources, compiled to dist/ for prod. Imports shared types via `@shared/*` path alias mapped to `../shared/dist/*`.
- frontend/: Next.js app with app/ directory. Uses path aliases `@/*` and `@shared/*` (to source-only shared types in dev; do not import server-only code).
- shared/: TypeScript-only types/utilities compiled to dist/; consumed by backend (compiled) and frontend (types-only).

Installation

1. From repo root, install dependencies per package:
   - cd shared && npm i --no-audit --no-fund || true # shared frequently has no package.json; safe to skip
   - cd ../backend && npm i --no-audit --no-fund
   - cd ../frontend && npm i --no-audit --no-fund

Environment variables

- Backend requires a .env file in `backend/` (the server throws if JWT secrets are missing). Example template:

```
PORT=8008
NODE_ENV=development

MONGO_URI=mongodb://localhost:27017/amplify

JWT_SECRET=dev_jwt_secret
JWT_REFRESH_SECRET=dev_jwt_refresh_secret
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

SESSION_SECRET=dev_session_secret
FRONTEND_BASE_URL=http://localhost:3000

CLOUDINARY_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_SECRET=your_secret

NEXT_PAYMENT_GATEWAY_PUBLIC_KEY=pk_test_example
STRIPE_SECRET_KEY=sk_test_example

S3_ACCESS_KEY=example
S3_SECRET_ACCESS_KEY=example
S3_BUCKET_NAME=example
S3_BUCKET_REGION=ap-southeast-2

SMTP_USER=example@example.com
SMTP_PASS=example
EMAIL_FROM=Amplify <no-reply@example.com>
```

- Frontend requires `NEXT_PUBLIC_BACKEND_BASE_URL` in `frontend/.env.local`:

```
NEXT_PUBLIC_BACKEND_BASE_URL=http://localhost:8008
```

Common tasks

- Start backend (dev):

  - cd backend
  - npm run build:shared # builds ../shared first
  - npm run dev # ts-node-dev ./server.ts

- Start frontend (dev):

  - cd frontend
  - npm run dev # Next.js at http://localhost:3000

- Build and run backend (prod-like):

  - cd backend
  - npm run build # builds shared + backend
  - npm run start:prod # runs dist/server.js

- Build and run frontend (prod-like):
  - cd frontend
  - npm run build # builds shared + next build
  - npm start # next start

Notes

- Build order: The backend and frontend build scripts already run `tsc --build ../shared` first. For dev, if you edit `shared/`, re-run the build command in the consumer package or add a background `tsc --build -w ../shared` if you want live type updates for the backend.
- CORS: Backend allows `FRONTEND_BASE_URL` and http://localhost:3000. Ensure `FRONTEND_BASE_URL` matches your dev URL.
- Axios base URL: Frontend reads `NEXT_PUBLIC_BACKEND_BASE_URL`; cookies are sent via `withCredentials: true`.
- Socket.IO: The server initializes sockets on the HTTP server. Ensure the socket entrypoint exists or is stubbed on your branch before enabling realtime features.

Linting & formatting

- Frontend: `npm run lint` (ESLint 9 + Next rules). Build ignores ESLint errors via Next config.
- Backend: no ESLint configured. Follow TypeScript strictness and avoid `any`.
- General: match existing formatting; do not reformat unrelated code or change indentation style.

TypeScript specifics

- Project references are configured via `tsconfig.base.json` with path aliases:
  - `@shared/*` → shared/_ (frontend) or shared/dist/_ (backend)
- Frontend `tsconfig.json` uses `moduleResolution: bundler`. Keep imports ESM-compatible.
- Avoid importing server-only code into the Next.js app; only import types or universal utilities from `shared/`.

Tailwind

- Tailwind CSS v4 with `@tailwindcss/postcss`. Content paths are under `frontend/src/...` and `frontend/app/...`.

API conventions

- Express base path: `/api/v1` (see `backend/routes/index.ts`).
- Error handling: centralized `ErrorMiddleware` and `utils/ErrorHandler`. Return structured API responses using helpers in `backend/utils/responseHelpers.ts`.

Quality guardrails (for AI/codegen inside Cursor)

- Prefer descriptive names; avoid 1–2 char identifiers.
- Guard clauses over deep nesting; meaningful error handling; do not swallow exceptions.
- Keep functions small and single-purpose; annotate exported/public APIs explicitly.
- Do not add comments for trivial code; if needed, explain "why" above the code.
- Never introduce long opaque constants (hashes/binaries) into source.

Safety rails

- Do not commit secrets; keep them in `.env` files. Use examples in docs/rules instead of real values.
- Keep changes scoped; avoid cross-package refactors unless necessary.

Quick references

- Backend scripts: `build:shared`, `build`, `dev`, `start:prod`, `start`.
- Frontend scripts: `build:shared`, `dev`, `build`, `start`, `lint`.

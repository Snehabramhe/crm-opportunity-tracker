# Mini CRM Opportunity Tracker

A secure full-stack MERN application for managing a **shared sales opportunity pipeline**. Any authenticated team member can view every opportunity, but **only the creator can edit or delete their own** — ownership is enforced in the backend, not just hidden in the UI.

---

## Table of Contents
1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Security Model](#security-model)
5. [Environment Variables](#environment-variables)
6. [Backend Setup](#backend-setup)
7. [Frontend Setup](#frontend-setup)
8. [Database Seeding & Test Account](#database-seeding--test-account)
9. [Running with Docker](#running-with-docker)
10. [API Reference](#api-reference)
11. [Deployment](#deployment)
12. [Testing](#testing)
13. [Known Limitations & Future Improvements](#known-limitations--future-improvements)

---

## Features

**Core**
- JWT authentication (register / login / logout / profile) with bcrypt-hashed passwords.
- JWT stored in a **secure, httpOnly cookie** (immune to XSS token theft).
- Shared opportunity pipeline visible to all logged-in users.
- Full CRUD on opportunities with **backend-enforced ownership** authorization.
- Request validation with Zod; consistent JSON errors and correct HTTP status codes.

**Bonus (all included)**
- **Kanban board** by stage + toggleable table view.
- **Dashboard summary cards** — open pipeline value, won value, high-priority count, and total. Computed by a dedicated **server-side aggregation endpoint** (`GET /api/opportunities/stats`) so the figures reflect the **entire pipeline**, not just the current page or filter.
- **Search, filter** (stage / priority / owner — incl. a "My opportunities" view), and **sort** (value, date, follow-up).
- **Activity / follow-up history** per opportunity.
- **Pagination** end-to-end — paginated list endpoint **and** frontend page controls (10 records per page, with a "Showing X–Y of N" range).
- **Database seed script** to generate hundreds of realistic mock opportunities for demos/testing (`npm run seed`).
- **Centralized logging** (morgan HTTP request logs through a single logger module) **and centralized exception handling**.
- **Docker** setup (backend + frontend + MongoDB) via `docker-compose`.
- **Automated API tests** (Jest + Supertest) for auth, ownership, and stats.
- Responsive UI (desktop + mobile), loading / empty / error states, toast notifications.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 (Vite), React Router, Axios, Tailwind CSS |
| Backend | Node.js, Express 4 |
| Database | MongoDB + Mongoose |
| Auth | JWT (jsonwebtoken) in httpOnly cookie, bcryptjs |
| Validation | Zod |
| Logging | morgan (HTTP request logs) + centralized logger module |
| Testing | Jest, Supertest, mongodb-memory-server |
| Deployment | Vercel (frontend), Render (backend), MongoDB Atlas (DB), Docker |

---

## Project Structure

```
CRM Opportunity Tracker/
├── backend/
│   ├── src/
│   │   ├── config/       # env loading + Mongoose connection
│   │   ├── controllers/  # request/response handling (auth, opportunity)
│   │   ├── services/     # business logic + ownership checks
│   │   ├── middleware/   # auth, validation, error handling
│   │   ├── models/       # User, Opportunity (Mongoose schemas)
│   │   ├── validators/   # Zod request schemas
│   │   ├── routes/       # auth + opportunity routes
│   │   ├── utils/        # ApiError, JWT helpers, asyncHandler, logger
│   │   ├── app.js        # express app
│   │   └── server.js     # entry point
│   ├── scripts/          # seed.js (mock data + demo/test accounts)
│   ├── tests/            # Jest + Supertest API tests
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/   # Navbar, cards, board, table, form, filters, pagination, UI primitives
│   │   ├── context/      # AuthContext, ToastContext
│   │   ├── pages/        # Login, Register, Dashboard, Health
│   │   ├── services/     # axios instance + API wrappers
│   │   ├── App.jsx, main.jsx, constants.js
│   ├── Dockerfile + nginx.conf
│   └── .env.example
├── docker-compose.yml
└── README.md
```

---

## Security Model

- **Passwords** are hashed with bcrypt (`pre('save')` hook) and never returned (`select: false`).
- **Authentication**: on register/login the server issues a JWT and sets it as an `httpOnly` cookie. The token is also returned in the response body so API clients (Postman/tests) can use `Authorization: Bearer <token>`.
- **Identity is derived only from the token.** `owner` / `user_id` / `created_by` sent in a request body are stripped by the Zod validators and can never override the authenticated user.
- **Ownership authorization** for update/delete/activity happens in `opportunityService` → `403 Forbidden` for non-owners, `404` if the record doesn't exist.
- All `/api/opportunities` routes require authentication (`401` otherwise).
- Secrets (JWT secret, Mongo URI, allowed origin) live in environment variables; `.env` is git-ignored, `.env.example` is committed.
- **CORS** is restricted to the configured `CLIENT_ORIGIN` with `credentials: true`.

### Cookie behavior across environments
| Environment | SameSite | Secure | Notes |
|---|---|---|---|
| Local dev (`NODE_ENV=development`) | `Lax` | `false` | Frontend proxies `/api` to backend → same-origin |
| Production (`NODE_ENV=production`) | `None` | `true` | Frontend (Vercel) and backend (Render) are different domains, so the cookie must be cross-site. **Both must be HTTPS.** |

---

## Environment Variables

### Backend (`backend/.env`)
| Variable | Description | Example |
|---|---|---|
| `PORT` | Server port | `8000` |
| `NODE_ENV` | `development` / `production` | `development` |
| `MONGO_URI` | MongoDB connection string | `mongodb+srv://…/crm` |
| `JWT_SECRET` | Secret for signing tokens | long random string |
| `JWT_EXPIRES_IN` | Token lifetime | `2h` |
| `COOKIE_MAX_AGE` | Cookie lifetime (ms) | `7200000` |
| `CLIENT_ORIGIN` | Allowed frontend origin(s), comma-separated | `http://localhost:5173` |

### Frontend (`frontend/.env`)
| Variable | Description | Example |
|---|---|---|
| `VITE_API_URL` | Backend API base URL | `/api` (dev) or `https://your-backend.onrender.com/api` |

Generate a strong JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

---

## Backend Setup

```bash
cd backend
cp .env.example .env        # then fill in MONGO_URI and JWT_SECRET
npm install
npm run dev                 # starts on http://localhost:8000 with nodemon
```

Health check: `GET http://localhost:8000/api/health`

---

## Frontend Setup

```bash
cd frontend
cp .env.example .env        # default VITE_API_URL=/api works for local dev
npm install
npm run dev                 # starts on http://localhost:5173
```

The Vite dev server proxies `/api` → `http://localhost:8000`, so the frontend and backend are same-origin during development (cookies just work).

---

## Database Seeding & Test Account

### Seed mock data
A single seed script generates realistic mock opportunities (random companies, contacts, deal values, stages, priorities, and follow-up dates) so the dashboard, pagination, filters, and stats have data to work with. The same script **ensures the demo owner accounts and the test login account exist** (all use Western names and the password `Password123`), and assigns all seeded data to them — so no personal data appears in the mock set. It **appends** by default.

```bash
cd backend
npm run seed            # append 500 opportunities (default)
npm run seed 100        # append 100
npm run seed 500 fresh  # delete ALL opportunities first, then add 500
```

> The `fresh` flag wipes the entire `opportunities` collection before seeding — use it only for a clean reset. Plain `npm run seed` never deletes anything.

### Test login credentials
The seed script creates four ready-to-use accounts that own the mock data (all share the password `Password123`). Use **`test@crm.test`** as the primary evaluation login.

| Name | Email | Password |
|---|---|---|
| Test User | `test@crm.test` | `Password123` |
| Albert Johnson | `albert@crm.test` | `Password123` |
| John Smith | `john@crm.test` | `Password123` |
| Emma Williams | `emma@crm.test` | `Password123` |

Logging in as any of them shows that account's own records with **Edit/Delete** enabled and everyone else's as read-only — useful for demonstrating ownership authorization. You can also register a fresh account at `/register` at any time.

---

## Running with Docker

Spins up MongoDB + backend + frontend together:

```bash
# optional: export a real secret first
export JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")
docker compose up --build
```

Then open **http://localhost:8080**. Nginx serves the frontend and proxies `/api` to the backend container (same-origin).

---

## API Reference

Base URL: `/api`

### Auth
| Method | Endpoint | Auth | Body | Success |
|---|---|---|---|---|
| POST | `/auth/register` | – | `{ name, email, password }` | `201` `{ user, token }` |
| POST | `/auth/login` | – | `{ email, password }` | `200` `{ user, token }` |
| POST | `/auth/logout` | ✓ | – | `200` |
| GET | `/auth/me` | ✓ | – | `200` `{ user }` |

### Opportunities
| Method | Endpoint | Auth | Access | Notes |
|---|---|---|---|---|
| GET | `/opportunities` | ✓ | all users | query: `stage, priority, search, sort, page, limit, mine` (`mine=true` → only the caller's own, owner taken from JWT) |
| GET | `/opportunities/stats` | ✓ | all users | global pipeline aggregates for the dashboard cards |
| POST | `/opportunities` | ✓ | all users | owner set from token |
| GET | `/opportunities/:id` | ✓ | all users | |
| PUT | `/opportunities/:id` | ✓ | **owner only** | `403` for others |
| DELETE | `/opportunities/:id` | ✓ | **owner only** | `403` for others |
| POST | `/opportunities/:id/activity` | ✓ | **owner only** | `{ text }` |

**Paginated list response** (`GET /opportunities`):
```json
{ "success": true, "items": [ /* … */ ], "total": 502, "page": 1, "pages": 51, "limit": 10 }
```

**Stats response** (`GET /opportunities/stats`) — aggregated across the whole collection:
```json
{ "success": true, "stats": { "openPipelineValue": 1250000, "wonValue": 300000, "highPriorityCount": 42, "total": 502 } }
```

**Error shape** (consistent across the API):
```json
{ "success": false, "message": "Validation failed", "details": [{ "field": "email", "message": "Invalid email format" }] }
```

**Status codes:** `200` OK · `201` Created · `400` validation · `401` unauthenticated · `403` not the owner · `404` not found · `409` duplicate email · `500` server error.

---

## Deployment

### 1. Database — MongoDB Atlas
1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. Add a database user and allow network access (`0.0.0.0/0` for simplicity).
3. Copy the connection string → this is your `MONGO_URI`.

### 2. Backend — Render
1. New → **Web Service**, connect the GitHub repo, root directory `backend`.
2. Build command: `npm install` · Start command: `npm start`.
3. Add environment variables: `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN=2h`, `COOKIE_MAX_AGE=7200000`, `NODE_ENV=production`, and `CLIENT_ORIGIN=https://<your-vercel-app>.vercel.app`.
4. Deploy and note the backend URL, e.g. `https://crm-backend.onrender.com`.

### 3. Frontend — Vercel
1. New Project → import the repo, root directory `frontend`.
2. Framework preset: **Vite**. Build: `npm run build`, output: `dist`.
3. Environment variable: `VITE_API_URL=https://crm-backend.onrender.com/api`.
4. Deploy, then set the backend's `CLIENT_ORIGIN` to the resulting Vercel URL and redeploy the backend.

> **Important:** Because the frontend and backend are on different domains in production, the auth cookie uses `SameSite=None; Secure`. Both services must be served over HTTPS (Vercel and Render both provide this by default).

---

## Testing

```bash
cd backend
npm test
```

Covers (Jest + Supertest, in-memory MongoDB):
- Registration: success, duplicate email (`409`), invalid email / short password (`400`).
- Login: valid credentials, wrong password / unknown email (`401`).
- Profile: `/auth/me` with and without a token.
- Opportunities: auth required (`401`), owner derived from token, **spoofed `owner`/`user_id` in body ignored**.
- **Ownership: owner can update/delete (`200`), non-owner cannot (`403`), missing record (`404`).**
- Shared pipeline visibility, the `mine=true` owner filter, and activity notes.
- **Global stats aggregation** (`/opportunities/stats`) across multiple owners.

---

## Known Limitations & Future Improvements
- **CSRF:** mitigated by `SameSite` cookies + a strict CORS origin; a dedicated CSRF token could be added for defense-in-depth.
- **Token refresh:** single ~2h access token, no refresh-token rotation — users re-login after expiry.
- **Kanban** is column-grouped (no drag-and-drop reordering); stage changes are made via the edit form.
- Potential enhancements: role-based admin access, email notifications for follow-ups, audit log, and full-text search tuning.

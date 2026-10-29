# Fixora

Complaint management system with a Node/Express backend and HTML/CSS/JS frontend.

## Project Structure

```
Fixora/
├── fixora-backend/   # Express API server
├── fixora-frontend/  # Static frontend
└── package.json      # Root scripts
```

## Scripts

All commands are run from the **root** directory.

### Install

| Command | Description |
|---|---|
| `npm run install:backend` | Install backend dependencies |
| `npm run install:all` | Install all dependencies |

### Run

| Command | Description |
|---|---|
| `npm run dev` | Start both servers (backend with nodemon, frontend) |
| `npm start` | Start both servers (backend with node, frontend) |
| `npm run start:backend` | Start backend only (node) |
| `npm run start:backend:dev` | Start backend only (nodemon) |
| `npm run start:frontend` | Start frontend only |

### Test

| Command | Description |
|---|---|
| `npm run test:backend` | Run backend test suite (vitest) |

## Getting Started

```bash
# 1. Install dependencies
npm run install:all

# 2. Seed the database (first time only)
cd fixora-backend
node seed.js
cd ..

# 3. Start the backend
npm run start:backend
```

The API will be available at `http://localhost:5000/api`.

To connect the frontend, open `fixora-frontend/js/api.js` and set:
```js
const USE_MOCK = false;
const API_BASE = 'http://localhost:5000/api';
```

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| Student | `student@college.edu` | `student123` |
| Admin | `admin@college.edu` | `admin123` |

## Running Tests

```bash
cd fixora-backend
npm test
```

46 tests across auth, complaints, staff, and reports — using vitest + supertest + fast-check.

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

## Getting Started

```bash
npm run install:all
npm run dev
```

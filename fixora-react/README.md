# Fixora: College Complaint and Maintenance System (React frontend, MERN)

React 18 + Vite + React Router. This is the **R** in MERN. The backend (Express, MongoDB, Node) plugs in through `src/api/api.js`.

## Run it
1. Install Node.js 18 or newer (nodejs.org).
2. In this folder run:
```
npm install
npm run dev
```
3. Open http://localhost:5173. Sign in as **Student** (Dheeptha Kansal) or **Admin**. Any email and password works in demo mode.

## Folder structure
```
index.html                    Vite entry page
public/fixora-logo.jpg        Logo
src/main.jsx                  Starts React (Router + login provider)
src/App.jsx                   All page URLs (routes)
src/styles.css                All styling (colours are CSS variables at the top)
src/utils.js                  Small helpers (counts, priority suggestion)
src/context/AuthContext.jsx   Logged-in user (login / logout)
src/components/               Layout (sidebar + header), Badge, StatCards, Bars, ComplaintsTable, ProtectedRoute
src/pages/                    Login, StudentDashboard, NewComplaint, TrackComplaint,
                              AdminDashboard, AdminStaff, AdminReports
src/api/api.js                ALL backend calls (mock or real)
src/data/mockData.js          Sample data (delete once the backend is connected)
```

## Pages and URLs
| URL | Page | Who |
|---|---|---|
| `/` | Login | everyone |
| `/student` | Student dashboard | student |
| `/student/new` | New complaint | student |
| `/complaint` and `/complaint/:id` | Complaint details and timeline | student, admin |
| `/admin` | Admin dashboard | admin |
| `/admin/staff` | Maintenance staff | admin |
| `/admin/reports` | Reports and CSV export | admin |

## Connecting the Express + MongoDB backend
1. In `src/api/api.js` set `USE_MOCK = false`.
2. Create a `.env` file in this folder: `VITE_API_BASE=http://localhost:5000/api`
3. In the Express server, allow CORS for `http://localhost:5173`.
4. The endpoints and response shapes are listed in the Fixora Backend Requirements Brief. Each function in `api.js` has its endpoint in a comment.
5. After login, save the `token` returned by the server inside the user object (`login(user)` in `AuthContext`). `api.js` sends it as `Authorization: Bearer <token>`.

## Still to build
Notifications, feedback form, saving comments, photo upload to the server (`FormData`), register page.

## Git
```
git add .
git commit -m "Fixora React frontend"
git push
```
Do not commit `node_modules` (already in `.gitignore`).

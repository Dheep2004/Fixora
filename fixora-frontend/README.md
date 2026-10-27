# Fixora: College Complaint and Maintenance System (Frontend)

Plain HTML, CSS and JavaScript. No build step and no installs needed.

## Run it
1. Open the folder in VS Code.
2. Install the **Live Server** extension, right-click `index.html` and choose **Open with Live Server**.
   (Double-clicking `index.html` also works.)
3. Sign in as **Student** (Dheeptha Kansal) or **Admin** to preview each dashboard. Any email and password works in demo mode.

## Folder structure
```
index.html               Login (role select)
student-dashboard.html   Student: my complaints + stats
new-complaint.html       Student: submit a complaint (priority suggestion, duplicate warning)
track-complaint.html     Both roles: status timeline, details, comments; admin can assign/escalate
admin-dashboard.html     Admin: stats, recent complaints, categories, recurring problems
admin-staff.html         Admin: maintenance staff, availability and open complaints
admin-reports.html       Admin: charts by category/priority/status, repeat locations, CSV export
css/styles.css           All styling (colours are CSS variables at the top)
js/data.js               Sample data (delete once the backend is connected)
js/api.js                ALL backend calls live here
js/ui.js                 Shared helpers: session, sidebar, header, tables
assets/                  Logo
```

## For the backend developer
Every page calls the backend only through the `api` object in `js/api.js`.
1. Set `USE_MOCK = false` and set `API_BASE` (default `http://localhost:5000/api`).
2. Implement these endpoints (response shapes match `js/data.js`):

| Function | Endpoint |
|---|---|
| `login` | `POST /auth/login` |
| `getComplaints` | `GET /complaints` |
| `getMyComplaints` | `GET /complaints/mine` |
| `getComplaint` | `GET /complaints/:id` |
| `createComplaint` | `POST /complaints` |
| `checkDuplicate` | `POST /complaints/check-duplicate` |
| `assignStaff` | `PATCH /complaints/:id/assign` |
| `escalate` | `POST /complaints/:id/escalate` |
| `getStaff` | `GET /staff` |
| `getRecurringIssues` | `GET /reports/recurring` |

Complaint object: `id, title, description, category, location, priority (High|Medium|Low), status (Pending|In progress|Resolved), assignedTo, reportedBy, comments[]`.

Notes: login currently stores the user in `localStorage` (see `js/ui.js`); replace with a real token/session. Photo upload is collected in `new-complaint.html` but not sent yet; use `FormData` when ready. Remember to enable CORS on the server.

## Not built yet
Notifications and the feedback form.

## Put it on GitHub
```
git init
git add .
git commit -m "Fixora frontend"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

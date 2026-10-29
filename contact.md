# Fixora API Contract

> This document is the shared source of truth between the backend and frontend teams.
> Frontend developers should not need to read backend source code to integrate the API.
> Update this file in the same task whenever an endpoint changes. Document breaking changes.

---

## Project Overview

Fixora is a college complaint and maintenance management system. Students submit campus issues; admins manage, assign, and resolve them.

## Responsibilities

| Team | Responsibility |
|---|---|
| Backend | REST API at `http://localhost:5000/api`, SQLite database, authentication, business logic |
| Frontend | Static HTML/CSS/JS; calls the API exclusively through `api.js`; no backend logic |

## Base URL

```
Development: http://localhost:5000/api
```

Set `API_BASE = 'http://localhost:5000/api'` and `USE_MOCK = false` in `fixora-frontend/js/api.js` to connect to the real backend.

---

## Authentication

All protected endpoints require a `Bearer` token in the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

Tokens are returned by `POST /auth/login`. They do not expire in the MVP (no expiry set). Store the token in `localStorage` alongside the user object.

---

## User Roles

| Role | Value in token | Can do |
|---|---|---|
| Student | `student` | Submit complaints, view own complaints, check duplicates |
| Admin | `admin` | View all complaints, assign staff, change status, escalate, view reports |

The role is included in the JWT payload and in every `/auth/login` response.

---

## Endpoint Inventory

### Authentication

#### POST /auth/login
**Status: Implemented**

Sign in and receive a JWT.

Request:
```json
{
  "email": "student@college.edu",
  "password": "yourpassword",
  "role": "student"
}
```

Success `200`:
```json
{
  "token": "<jwt>",
  "user": {
    "id": 1,
    "name": "Dheeptha Kansal",
    "role": "student",
    "roleLabel": "Student"
  }
}
```

Errors:
- `401` — `{ "error": "Invalid email or password" }`
- `400` — `{ "error": "email and password are required" }`

---

#### GET /auth/me
**Status: Implemented**

Returns the currently authenticated user's profile.

Headers: `Authorization: Bearer <token>`

Success `200`:
```json
{
  "id": 1,
  "name": "Dheeptha Kansal",
  "role": "student",
  "roleLabel": "Student"
}
```

Errors:
- `401` — missing or invalid token

---

### Complaints

#### GET /complaints
**Status: Implemented**
**Auth: Admin only**

Returns all complaints. Supports optional filters and pagination.

Query parameters:

| Param | Type | Description |
|---|---|---|
| `status` | string | Filter by status: `Pending`, `In progress`, `Resolved` |
| `category` | string | Filter by category (see allowed values below) |
| `priority` | string | Filter by priority: `High`, `Medium`, `Low` |
| `page` | integer | Page number, default `1` |
| `limit` | integer | Items per page, default `20` |

Success `200`:
```json
{
  "data": [
    {
      "id": "C-1048",
      "title": "Sparking switchboard",
      "description": "Near the lab door",
      "category": "Electrical",
      "location": "Lab 3, Block A",
      "priority": "High",
      "status": "Pending",
      "assignedTo": null,
      "reportedBy": "Dheeptha Kansal",
      "createdAt": "2026-10-29T10:00:00Z",
      "comments": []
    }
  ],
  "total": 45,
  "page": 1,
  "totalPages": 3
}
```

---

#### GET /complaints/mine
**Status: Implemented**
**Auth: Student only**

Returns only complaints submitted by the authenticated student. Accepts the same filter and pagination query params as `GET /complaints`.

Success `200`: same envelope as `GET /complaints`

---

#### POST /complaints
**Status: Implemented**
**Auth: Student only**

Submit a new complaint. Send as `multipart/form-data` when including photos, otherwise JSON.

Body fields:

| Field | Required | Type | Notes |
|---|---|---|---|
| `title` | Yes | string | Short issue title |
| `description` | Yes | string | Detailed description |
| `category` | Yes | string | Must be one of the allowed categories |
| `location` | Yes | string | e.g. `"Lab 3, Block A"` |
| `photos` | No | file[] | Up to 3 images; `image/jpeg`, `image/png`, or `image/webp`; max 5 MB each |

The server auto-computes `priority` from keywords in `title` + `description`. The client-side priority suggestion in `new-complaint.html` is display-only; the backend value is authoritative.

Success `201`:
```json
{
  "id": "C-1049",
  "title": "Sparking switchboard",
  "description": "Near the lab door",
  "category": "Electrical",
  "location": "Lab 3, Block A",
  "priority": "High",
  "status": "Pending",
  "assignedTo": null,
  "reportedBy": "Dheeptha Kansal",
  "createdAt": "2026-10-29T10:00:00Z",
  "comments": []
}
```

Errors:
- `400` — missing required field or invalid category or invalid file type

---

#### POST /complaints/check-duplicate
**Status: Implemented**
**Auth: Student only**

Check if an open complaint already exists for a given location.

Request:
```json
{ "location": "Lab 3, Block A" }
```

Success `200` — match found:
```json
{
  "id": "C-1047",
  "title": "Water leakage in washroom",
  "status": "In progress"
}
```

Success `200` — no match:
```json
null
```

---

#### GET /complaints/:id
**Status: Implemented**
**Auth: Any authenticated user**

Returns full complaint details including comments.

Students may only access their own complaints (403 for others). Admins can access any complaint.

Success `200`:
```json
{
  "id": "C-1047",
  "title": "Water leakage in washroom",
  "description": "Pipe joint leaking",
  "category": "Plumbing",
  "location": "Hostel B, Floor 2",
  "priority": "High",
  "status": "In progress",
  "assignedTo": "R. Kumar (Plumber)",
  "reportedBy": "Dheeptha Kansal",
  "createdAt": "2026-10-28T09:00:00Z",
  "comments": [
    { "author": "R. Kumar", "text": "Pipe joint corroded, replacing today." }
  ]
}
```

Errors:
- `403` — student accessing another student's complaint
- `404` — complaint not found

---

#### PATCH /complaints/:id/assign
**Status: Implemented**
**Auth: Admin only**

Assign a maintenance staff member to a complaint. If the complaint is currently `Pending`, its status automatically transitions to `In progress`.

Request:
```json
{ "staff": "R. Kumar (Plumber)" }
```

The `staff` value must match a `key` field from `GET /staff`.

Success `200` — updated complaint object (same shape as `GET /complaints/:id`).

Errors:
- `400` — staff key does not exist
- `403` — non-admin
- `404` — complaint not found

---

#### PATCH /complaints/:id/status
**Status: Implemented**
**Auth: Admin only**

Update complaint status. Only permitted transitions:
- `Pending` → `In progress`
- `In progress` → `Resolved`

Request:
```json
{ "status": "Resolved" }
```

Success `200` — updated complaint object.

Errors:
- `422` — `{ "error": "Cannot transition from Pending to Resolved" }`
- `403` — non-admin
- `404` — complaint not found

---

#### POST /complaints/:id/escalate
**Status: Implemented**
**Auth: Admin only**

Set complaint priority to `High`. Idempotent — safe to call multiple times.

No request body required.

Success `200` — updated complaint object with `priority: "High"`.

---

### Staff

#### GET /staff
**Status: Implemented**
**Auth: Admin only**

Returns all maintenance staff records.

Success `200`:
```json
[
  { "name": "R. Kumar",  "trade": "Plumber",       "phone": "98xxxxxx01", "key": "R. Kumar (Plumber)" },
  { "name": "S. Verma",  "trade": "AV technician", "phone": "98xxxxxx02", "key": "S. Verma (AV)" },
  { "name": "M. Singh",  "trade": "Electrician",   "phone": "98xxxxxx03", "key": "M. Singh (Electrician)" },
  { "name": "Housekeeping team", "trade": "Cleaning and sanitation", "phone": "98xxxxxx04", "key": "Housekeeping" }
]
```

---

### Reports

#### GET /reports/recurring
**Status: Implemented**
**Auth: Admin only**

Returns locations with more than one open (non-Resolved) complaint, as human-readable strings.

Success `200`:
```json
[
  "Hostel B, Floor 2: 4 open complaints",
  "Lab 3, Block A: 3 open complaints"
]
```

---

## Error Response Format

All error responses use this exact shape:

```json
{ "error": "<human-readable message>" }
```

No stack traces or internal details are ever returned. The HTTP status code communicates the category:

| Code | Meaning |
|---|---|
| `400` | Validation failure — missing or invalid field |
| `401` | Missing or invalid token |
| `403` | Authenticated but wrong role, or accessing another user's resource |
| `404` | Resource not found |
| `422` | Business rule violation (e.g. invalid status transition) |
| `500` | Unexpected server error — message is always `"Internal server error"` |

---

## Allowed Enum Values

**Categories** (for `category` field in complaints):
```
Electrical | Plumbing | Sanitation | Classroom | Lab equipment | Hostel | Other
```

**Status values** (for `status` field and `?status=` filter):
```
Pending | In progress | Resolved
```

**Priority values** (for `priority` field and `?priority=` filter):
```
High | Medium | Low
```

---

## Pagination

All list endpoints return this envelope:

```json
{
  "data": [...],
  "total": 45,
  "page": 1,
  "totalPages": 3
}
```

Pass `?page=2&limit=10` to paginate. Defaults: `page=1`, `limit=20`.

---

## File Upload Convention

Use `multipart/form-data` when submitting `POST /complaints` with photos. The `photos` field is a multi-value file field (same key repeated):

```html
<input type="file" name="photos" multiple accept="image/*">
```

Accepted MIME types: `image/jpeg`, `image/png`, `image/webp`
Max file size: 5 MB per file
Max files per complaint: 3

---

## Known Limitations (MVP)

- No JWT expiry — tokens do not expire
- No email notifications
- Comments are read-only in MVP (no POST endpoint to add comments)
- No feedback/rating system
- Photo storage is local disk (`uploads/` folder) — not suitable for production deployment without a file server

---

## Seed Data

Run `node seed.js` inside `fixora-backend/` once before testing:

| Role | Email | Password |
|---|---|---|
| Student | `student@college.edu` | `student123` |
| Admin | `admin@college.edu` | `admin123` |

---

## Change History

| Date | Change | Breaking? |
|---|---|---|
| 2026-10-29 | Initial draft — all endpoints Planned | — |
| 2026-10-29 | Backend implemented — all 12 endpoints marked Implemented | — |

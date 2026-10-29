CREATE TABLE IF NOT EXISTS users (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  name     TEXT    NOT NULL,
  email    TEXT    NOT NULL UNIQUE,
  password TEXT    NOT NULL,
  role     TEXT    NOT NULL CHECK(role IN ('student', 'admin'))
);

CREATE TABLE IF NOT EXISTS staff (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  name  TEXT NOT NULL,
  trade TEXT NOT NULL,
  phone TEXT NOT NULL,
  key   TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS complaints (
  id          INTEGER  PRIMARY KEY AUTOINCREMENT,
  code        TEXT     NOT NULL UNIQUE,
  title       TEXT     NOT NULL,
  description TEXT     NOT NULL,
  category    TEXT     NOT NULL,
  location    TEXT     NOT NULL,
  priority    TEXT     NOT NULL CHECK(priority IN ('High', 'Medium', 'Low')),
  status      TEXT     NOT NULL DEFAULT 'Pending'
                       CHECK(status IN ('Pending', 'In progress', 'Resolved')),
  assigned_to TEXT,
  reported_by INTEGER  NOT NULL REFERENCES users(id),
  created_at  DATETIME NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS attachments (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  complaint_id INTEGER NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  filename     TEXT    NOT NULL,
  mime_type    TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_complaints_status   ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_reported ON complaints(reported_by);
CREATE INDEX IF NOT EXISTS idx_complaints_location ON complaints(location);

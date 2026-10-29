const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'fixora.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

const db = new Database(DB_PATH);

// Enable WAL for better concurrency and enforce foreign keys
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Run schema on startup (all statements are CREATE TABLE/INDEX IF NOT EXISTS)
const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
db.exec(schema);

module.exports = db;

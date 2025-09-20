import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync(":memory:");

db.exec(`
CREATE TABLE user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
    )
`);

db.exec(`
CREATE TABLE todo (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    task TEXT,
    completed BOOLEAN DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES user(id)
    )
`);

db.exec(`
    CREATE TABLE num_users (
        count INTEGER 
    )
`);
db.exec(`
    INSERT INTO num_users (count) VALUES (0)
`);

export default db;

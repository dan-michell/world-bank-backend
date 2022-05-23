import { Client } from "https://deno.land/x/postgres@v0.11.3/mod.ts";

// URL of postgres db hosted on elephant
const client = new Client("postgres://fngiwpog:6WF15PtQfkrnPrJ9APx-uAUfvlEOD5dm@tyke.db.elephantsql.com/fngiwpog");
await client.connect();

await client.queryArray`CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    encrypted_password TEXT NOT NULL,
    salt TEXT NOT NULL,
    created_at DATE NOT NULL
  )`;

await client.queryArray`CREATE TABLE history (
    id SERIAL PRIMARY KEY,
    country_name TEXT,
    indicator TEXT,
    year_range TEXT,
    created_at DATE NOT NULL
  )`;

await client.queryArray`CREATE TABLE sessions (
    uuid TEXT PRIMARY KEY,
    created_at DATE NOT NULL,
    user_id INTEGER
  )`;

import { Application } from "https://deno.land/x/abc@v1.3.3/mod.ts";
import { Client } from "https://deno.land/x/postgres@v0.11.3/mod.ts";
import { abcCors } from "https://deno.land/x/cors/mod.ts";
import * as bcrypt from "https://deno.land/x/bcrypt/mod.ts";
import { v4 } from "https://deno.land/std@0.140.0/uuid/mod.ts";

const worldDataClient = new Client(
  "postgres://czreijar:TJ2StTuQIl2CoRoinQTwPxk8pBGfdf6t@kandula.db.elephantsql.com/czreijar"
);
const userDataClient = new Client(
  "postgres://fngiwpog:6WF15PtQfkrnPrJ9APx-uAUfvlEOD5dm@tyke.db.elephantsql.com/fngiwpog"
);
await worldDataClient.connect();
await userDataClient.connect();
const app = new Application();
const PORT = 8080;

app
  .use(abcCors({ origin: "http://localhost:3000", credentials: true }))
  .post("/users", handleRegistration)
  .post("/sessions", handleLogin)
  .delete("/sessions", handleLogout)
  .get("/search", retrieveSearchData)
  .post("/history", storeUserSearch)
  .get("/history", retrieveUserSearch)
  .start({ port: PORT });

async function handleRegistration(server) {
  // Take input from server body, validate, and insert into users table
}

async function handleLogin(server) {
  // Take input from server body, validate, create user cookie, insert into sessions
}

async function handleLogout(server) {
  // Delete entry from sessions where the userId === the userId of the user currently logged in.
}

async function retrieveSearchData(server) {
  // Query world bank data based on user search conditions and return data
}

async function storeUserSearch(server) {
  // Insert the conditions of the user search into history to be able to be used again
}

async function retrieveUserSearch(server) {
  // Return the history of the user based on the user Id (retrieved using cookies).
  // If the admin is logged in return history of all users
}

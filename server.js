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
  const { email, username, password, passwordConformation } = await server.body;
  if (validateRegistrationCredentials(email, username, password, passwordConformation)) {
    const salt = await bcrypt.genSalt(8);
    const passwordEncrypted = await hashPassword(password, salt);
    await userDataClient.queryArray({
      text: "INSERT INTO users (email, username, encrypted_password, salt, created_at) VALUES ($1, $2, $3, $4, NOW())",
      args: [email, username, passwordEncrypted, salt],
    });
    return server.json({ response: "Registration successful!" }, 200);
  }
  return server.json(
    {
      response: "Registration unsuccessful, check passwords match and email is valid.",
    },
    400
  );
}

async function handleLogin(server) {
  const { username, password } = await server.body;
  const isAuthorisedInfo = await loginAuthentication(username, password);
  if (isAuthorisedInfo[0]) {
    const userId = isAuthorisedInfo[1].rows[0].id;
    const sessionId = await createSessionId(userId);
    server.setCookie({
      name: "sessionId",
      value: sessionId,
    });
    return server.json(
      {
        response: "Login success!",
      },
      200
    );
  }
  return server.json({ response: "Login failed, check details and try again." }, 400);
}

async function handleLogout(server) {
  const sessionId = server.cookies.sessionId;
  const user = getCurrentUser(sessionId);
  if (user.length > 0) {
    const userId = user[0].id;
    await userDataClient.queryArray({
      text: "DELETE FROM sessions WHERE user_id = ?",
      args: [userId],
    });
    return server.json({ response: "Successfully logged out" }, 200);
  }
  return server.json({ response: "Not logged in" }, 400);
}

async function retrieveSearchData(server) {
  // Query world bank data based on user search conditions and return data
  const searchData = await worldDataClient.queryObject`SELECT * FROM series`;
  return server.json(searchData);
}

async function storeUserSearch(server) {
  // Insert the conditions of the user search into history to be able to be used again
}

async function retrieveUserSearch(server) {
  // Return the history of the user based on the user Id (retrieved using cookies).
  // If the admin is logged in return history of all users
}

async function validateRegistrationCredentials(email, username, password, passwordConformation) {
  const duplicateEmailCheck = await userDataClient.queryArray({
    text: "SELECT * FROM users WHERE email = $1",
    args: [email],
  });
  const duplicateUsernameCheck = await userDataClient.queryArray({
    text: "SELECT * FROM users WHERE username = $1",
    args: [username],
  });
  if (
    duplicateEmailCheck.rowCount < 1 &&
    duplicateUsernameCheck.rowCount < 1 &&
    password === passwordConformation &&
    password.length > 0
  ) {
    return true;
  }
  return false;
}

async function loginAuthentication(username, password) {
  const existingUserCheck = await userDataClient.queryObject({
    text: "SELECT * FROM users WHERE username = $1",
    args: [username],
  });
  if (existingUserCheck.rowCount > 0) {
    const userSalt = existingUserCheck.rows[0].salt;
    const userHashedPassword = existingUserCheck.rows[0].encrypted_password;
    const passwordEncrypted = await hashPassword(password, userSalt);
    if (passwordEncrypted === userHashedPassword) {
      return [true, existingUserCheck];
    }
  }
  return [false];
}

async function hashPassword(password, salt) {
  const hashedPassword = await bcrypt.hash(password, salt);
  return hashedPassword;
}

async function createSessionId(userId) {
  const sessionId = crypto.randomUUID();
  await userDataClient.queryArray({
    text: "INSERT INTO sessions (uuid, user_id, created_at) VALUES ($1, $2, NOW())",
    args: [sessionId, userId],
  });
  return sessionId;
}

async function getCurrentUser(sessionId) {
  const query =
    "SELECT * FROM users JOIN sessions ON users.id = sessions.user_id WHERE sessions.created_at < NOW() + INTERVAL '7 DAYS' AND sessions.uuid = $1";
  const user = await userDataClient.queryArray({
    text: query,
    args: [sessionId],
  });
  return user;
}

console.log(`Server running on http://localhost:${PORT}`);

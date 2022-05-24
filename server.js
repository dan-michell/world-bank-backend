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
    await userDataClient.queryArray(
      "INSERT INTO users (email, username, encrypted_password, salt, created_at, updated_at) VALUES (1$, 2$, 3$, 4$, NOW(), NOW())",
      [email, username, passwordEncrypted, salt]
    );
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
    const userId = isAuthorisedInfo[1][0].id;
    const sessionId = await createSessionId(userId);
    server.setCookie({
      name: "sessionId",
      value: sessionId,
    });
    return server.json({
      response: "Login success!",
    });
  }
  return server.json({ response: "Login failed, check details and try again." });
}

async function handleLogout(server) {
  // Delete entry from sessions where the userId === the userId of the user currently logged in.
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

function validateRegistrationCredentials(email, username, password, passwordConformation) {
  const duplicateEmailCheck = userDataClient.queryArray("SELECT * FROM users WHERE email = 1$", [email]);
  const duplicateUsernameCheck = userDataClient.queryArray("SELECT * FROM users WHERE username = 1$", [username]);
  if (
    duplicateEmailCheck.length < 1 &&
    duplicateUsernameCheck.length < 1 &&
    password === passwordConformation &&
    password.length > 0
  ) {
    return true;
  }
  return false;
}

async function loginAuthentication(username, password) {
  const existingUserCheck = userDataClient.queryArray("SELECT * FROM users WHERE username = 1$", [username]);
  if (existingUserCheck.length > 0) {
    const userSalt = existingUserCheck[0].salt;
    const userHashedPassword = existingUserCheck[0].encrypted_password;
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
  userDataClient.queryArray("INSERT INTO sessions (uuid, user_id, created_at) VALUES (1$, 2$, NOW())", [
    sessionId,
    userId,
  ]);
  return sessionId;
}

console.log(`Server running on http://localhost:${PORT}`);

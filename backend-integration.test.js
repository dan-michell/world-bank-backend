import { assert, assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { TextProtoReader } from "https://deno.land/std/textproto/mod.ts";
import { BufReader } from "https://deno.land/std/io/bufio.ts";
import { join } from "https://deno.land/std@0.137.0/path/mod.ts";
const dir = join(import.meta.url, "..");
const addr = "http://localhost:8080";

let server;

async function startServer(fpath) {
  server = Deno.run({
    cmd: [Deno.execPath(), "run", "--allow-write", "--allow-net", "--allow-read", fpath],
    stdout: "piped",
  });
  assert(server.stdout != null);

  const r = new TextProtoReader(new BufReader(server.stdout));
  const s = await r.readLine();
  console.log(s);
  assert(s !== null);
}

function killServer() {
  server.close();
  server.stdout?.close();
}

// Deno.test("Test correct error code is returned with invalid POST", async function () {
//   await startServer(join(dir, "./backend.js"));
//   try {
//     const result = await fetch("http://localhost:8080/shortlinks", {
//       method: "POST",
//       body: JSON.stringify({ fullUrl: "nothing" }),
//     });
//     const json = await result.json();

//     assertEquals(json.response, "Failed");
//     assertEquals(result.status, 400);
//   } finally {
//     killServer();
//   }
// });

// Deno.test("/urls returns JSON object containing all shortlinks", async () => {
//   await startServer(join(dir, "./backend.js"));
//   try {
//     const result = await fetch("http://localhost:8080/urls");
//     const json = await result.json();
//     assert(Object.keys(json).length > 0);
//   } finally {
//     killServer();
//   }
// });

// Deno.test("/l/:shortcode redirects to correct URL", async () => {
//   await startServer(join(dir, "./backend.js"));
//   try {
//     const result = await fetch("http://localhost:8080/l/ABCD");
//     assertEquals(result.redirected, true);
//     assertEquals(result.url, "https://www.google.com/");
//     await result.body.cancel();
//   } finally {
//     killServer();
//   }
// });

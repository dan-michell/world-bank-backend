import { assert, assertEquals, assertThrows } from "https://deno.land/std/testing/asserts.ts";
import { assertSpyCall, assertSpyCalls, stub } from "https://deno.land/x/mock@0.15.2/mod.ts";
import { Context } from "https://deno.land/x/abc@v1.3.1/mod.ts";

Deno.test("Generate correct working message", () => {
  assertEquals(getRunningMessage(), "Server is running");
});

Deno.test("Generate random four letter code", () => {
  const randomCode = randomShortcode();
  assertEquals(randomCode.length, 4);
});

Deno.test("Can store and retrieve values from key-value store", async () => {
  const store = new Store("test");
  const key = "123";
  const value = "abc";
  await store.set(key, value);
  assertEquals(await store.get("123"), "abc");
});

Deno.test("Entering invalid link throws an error", async () => {
  assertThrows(await isValidUrl("https://asdfg"));
});

Deno.test("Entering invalid link returns false", async () => {
  assertEquals(await isValidUrl("https://asdfg"), false);
});

Deno.test("Entering valid link returns true", async () => {
  const validity = await isValidUrl("https://www.google.com");
  assertEquals(validity, true);
});

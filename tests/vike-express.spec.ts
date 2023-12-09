import { test } from "@playwright/test";
import { exec } from "child_process";
import killPort from "kill-port";
import { gotoWithRetry } from "./utils.js";

const port = 5015;
const folder = "examples/vike-express";

test.beforeAll(async () => {
  try {
    await killPort(port);
  } catch (error) {}
  const cp = exec(
    `cd ${folder} && node node_modules/vite/bin/vite --host 127.0.0.1 --port ${port} --strictPort`
  );
  cp.stdout?.pipe(process.stdout);
  cp.stderr?.pipe(process.stderr);
  await new Promise((resolve) => setTimeout(resolve, 1000));
});

test.afterAll(async () => {
  try {
    await killPort(port);
  } catch (error) {}
});

test("logs Hello", async ({ page }) =>
  new Promise(async (resolve) => {
    page.on("console", (msg) => {
      if (msg.text().includes("Hello")) {
        resolve();
      }
    });

    await gotoWithRetry(page, `http://127.0.0.1:${port}`);
  }));

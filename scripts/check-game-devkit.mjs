import { chromium } from "@playwright/test";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import assert from "node:assert/strict";
const server = spawn(
  "python3",
  ["scripts/serve-experience.py", "public/experience"],
  { stdio: "ignore" },
);
let browser;
try {
  for (let i = 0; i < 40; i++) {
    try {
      if ((await fetch("http://127.0.0.1:5500/experience.json")).ok) break;
    } catch {}
    await delay(100);
  }
  const options = {
    executablePath: "/usr/bin/chromium",
    args: [
      "--no-sandbox",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
    ],
  };
  const value = process.env.HTTPS_PROXY || process.env.https_proxy;
  if (value) {
    const p = new URL(value);
    options.proxy = {
      server: `${p.protocol}//${p.hostname}:${p.port}`,
      bypass: "127.0.0.1,localhost",
      username: decodeURIComponent(p.username),
      password: decodeURIComponent(p.password),
    };
  }
  browser = await chromium.launch(options);
  const context = await browser.newContext({
    permissions: ["local-network-access"],
    viewport: { width: 1600, height: 1200 },
  });
  const page = await context.newPage();
  for (const phone of [false, true]) {
    const width = phone ? 390 : 960,
      height = phone ? 844 : 600,
      url = new URL("https://project0.city/devkit");
    url.search = new URLSearchParams({
      entry: "http://127.0.0.1:5500/main.js",
      width: "12",
      depth: "12",
      height: "19",
      size: `${width}x${height}`,
      slow: "1",
      ...(phone ? { phone: "1" } : {}),
    });
    await page.goto(url.href, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await page.waitForFunction(() => Boolean(window.devkit), {
      timeout: 30000,
    });
    assert.equal(
      await page.evaluate(() => devkit.wait()),
      "started",
      await page.evaluate(() => devkit.reason),
    );
    await delay(900);
    const shell = page
      .frames()
      .find((f) => f.url().includes("/sandbox/devkit/shell"));
    const d = await shell.locator("#c").boundingBox();
    // Main menu's actual Play button, in the experience canvas coordinates.
    const mh = Math.min(height - 24, 510),
      short = mh < 400,
      y = (height - mh) / 2 + (short ? 59 : 138) + (short ? 35 : 46) / 2;
    await page.mouse.click(d.x + d.width * 0.5, d.y + (d.height * y) / height);
    await delay(1000);
    // Aim and release inside the board, away from menu and inventory overlays.
    await page.mouse.click(d.x + d.width * 0.5, d.y + d.height * 0.6, {
      button: "right",
    });
    await page.mouse.click(d.x + d.width * 0.5, d.y + d.height * 0.6, {
      button: "right",
    });
    for (const x of [0.48, 0.58, 0.38]) {
      await page.mouse.move(d.x + d.width * x, d.y + d.height * 0.42);
      await page.mouse.down();
      await page.mouse.move(d.x + d.width * (x + 0.02), d.y + d.height * 0.38, {
        steps: 5,
      });
      await page.mouse.up();
      await delay(1500);
    }
    const result = await page.evaluate(() => ({
      status: devkit.status,
      errors: devkit.errors,
      hud: devkit.hud,
      frames: devkit.frames,
    }));
    assert.equal(result.status, "started");
    assert.deepEqual(result.errors, []);
    assert.ok(result.hud.includes("Bubble Critter Garden"));
    console.log(
      JSON.stringify({ mode: phone ? "phone" : "desktop", ...result }),
    );
    await page.locator("#device").screenshot({
      path: `docs/previews/game-devkit-debug-${phone ? "phone" : "desktop"}.png`,
    });
    assert.ok(/Shots [1-9]/.test(result.hud), "Real input resolved a shot");
    await page.locator("#device").screenshot({
      path: `docs/previews/game-devkit-playing-${phone ? "phone" : "desktop"}.png`,
    });
    await page.evaluate(() => devkit.press("KeyP", 50));
    await delay(250);
    await page.evaluate(() => devkit.press("KeyP", 50));
    await page.evaluate(() => devkit.drop());
    await delay(1200);
    assert.equal(await page.evaluate(() => devkit.status), "started");
    assert.deepEqual(await page.evaluate(() => devkit.errors), []);
    console.log(
      JSON.stringify({
        mode: phone ? "phone" : "desktop",
        ...result,
        reconnect: "passed",
      }),
    );
  }
  console.log(
    "PASS: production Project 0 sandbox loads the game, real input fires and scores, desktop/phone render, pause and reconnect work without runtime errors.",
  );
} finally {
  await browser?.close();
  server.kill();
}

import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
const server = spawn('node', ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '4176', '--strictPort'], { stdio: 'ignore' });
let browser;
try {
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch('http://127.0.0.1:4176/game.html')).ok) break; } catch {}
    await delay(100);
  }
  browser = await chromium.launch({ executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 960, height: 600 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('http://127.0.0.1:4176/game.html');
  await page.waitForFunction(() => Boolean(window.gardenGame), null, { timeout: 60000 });
  await page.evaluate(() => {
    gardenGame.action('play');
    const g = gardenGame.game;
    g.grid.cells.clear();
    g.nextUnlock = 99999;
    const roof = g.grid.put(0, 12, { type: 'normal', color: 0 });
    for (let r = 1; r < 4; r++) for (let c = 10; c < 15; c++)
      g.grid.put(r, c, { type: 'normal', color: (r + c) % 5 });
    g.settle([roof]);
    g.revision++;
  });
  await page.waitForFunction(() => gardenGame.game.gardenTime > 8, null, { timeout: 60000 });
  assert.equal(await page.evaluate(() => gardenGame.game.ground.length), 15);
  assert.equal(await page.evaluate(() => gardenGame.game.inventory.bomb), 0);
  const rendered = await page.evaluate(() => {
    const { game, view } = gardenGame;
    const positions = [];
    for (let i = 0; i < view.bubbles.count; i++) {
      const matrix = view.bubbles.instanceMatrix.array;
      positions.push([matrix[i * 16 + 12], matrix[i * 16 + 13]]);
    }
    return { count: positions.length, allResting: positions.every(([, y]) => y < 1.4), food: game.ground.length };
  });
  assert.deepEqual(rendered, { count: 15, allResting: true, food: 15 });
  await page.screenshot({ path: 'docs/previews/game-persistent-ground-food.png' });
  await page.evaluate(() => gardenGame.action('pause'));
  const paused = await page.evaluate(() => gardenGame.game.snapshot());
  await page.waitForTimeout(600);
  assert.deepEqual(await page.evaluate(() => gardenGame.game.snapshot()), paused);
  await page.evaluate(() => {
    gardenGame.action('resume');
    const g = gardenGame.game;
    const roof = g.grid.put(0, 12, { type: 'normal', color: 0 });
    g.grid.put(1, 11, { type: 'animal', kind: 'bunny', name: 'Mochi' });
    g.settle([roof]);
    g.revision++;
  });
  await page.waitForFunction(() => gardenGame.game.rescued.length === 1);
  assert.equal(await page.evaluate(() => gardenGame.game.rescued[0].totalEaten), 0);
  assert.equal(await page.evaluate(() => gardenGame.game.inventory.bomb), 0);
  await page.waitForFunction(() => gardenGame.game.rescued[0].totalEaten >= 10, null, { timeout: 60000 });
  const meal = await page.evaluate(() => {
    const g = gardenGame.game, pet = g.rescued[0];
    return { total: pet.totalEaten, remaining: g.ground.length, bombs: g.inventory.bomb, eaten: pet.eaten };
  });
  assert.equal(meal.remaining + meal.total, 15);
  assert.equal(meal.bombs, Math.floor(meal.total / 10));
  assert.equal(meal.eaten, meal.total % 10);
  await page.screenshot({ path: 'docs/previews/game-pet-bomb-drop.png' });
  await page.waitForFunction(() => gardenGame.game.ground.length === 0, null, { timeout: 45000 });
  assert.equal(await page.evaluate(() => gardenGame.game.rescued[0].totalEaten), 15);
  assert.equal(await page.evaluate(() => gardenGame.game.inventory.bomb), 1);
  // Refilling the same continuous garden preserves the rescued pet and its meals.
  await page.evaluate(() => {
    const g = gardenGame.game;
    const roof = g.grid.put(0, 12, { type: 'normal', color: 0 });
    g.grid.put(1, 12, { type: 'normal', color: 1 });
    g.settle([roof]);
    g.progress(); g.revision++;
  });
  await page.waitForFunction(() => gardenGame.game.rescued[0].totalEaten === 16, null, { timeout: 45000 });
  assert.equal(await page.evaluate(() => gardenGame.game.ground.length), 0);
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ persistentUnclaimedFood: 15, actualMeals: 16,
    bombsAfterTen: true, pauseFreezesGarden: true, continuousGardenPetsKeepEating: true, errors }));
} finally { await browser?.close(); server.kill(); }

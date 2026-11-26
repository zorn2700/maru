import { expect, test } from "@playwright/test";

test(" Карта квеста показывает все миры и звёзды", async ({ page }) => {
  await page.goto("/#/quest");
  await expect(page.locator(".quest-node")).toHaveCount(13);
  await expect(page.locator(".quest-summary")).toBeVisible();
  await expect(page.locator(".quest-node").first().locator("h2")).toBeVisible();
  await expect(page.locator(".quest-node.locked").first()).toBeVisible();
});

test(" галерея достижений фильтруется", async ({ page }) => {
  await page.goto("/#/achievements");
  const total = await page.locator(".achievement-card").count();
  expect(total).toBeGreaterThan(10);
  await page.locator('[data-achievement-filter="locked"]').click();
  const locked = await page.locator(".achievement-card").count();
  expect(locked).toBeLessThanOrEqual(total);
  await page.locator('[data-achievement-filter="earned"]').click();
  await expect(page.locator(".achievement-card")).toHaveCount(total - locked);
});

test(" аркада показывает три игры и календарь серии", async ({ page }) => {
  await page.goto("/#/arcade");
  await expect(page.locator(".game-tile")).toHaveCount(3);
  await expect(page.locator(".calendar-cell")).toHaveCount(35);
  await expect(page.locator(".streak-stats")).toBeVisible();
});

test(" матч пар считает ходы и находит пару", async ({ page }) => {
  await page.goto("/#/practice/match");
  await expect(page.locator(".match-card")).toHaveCount(12);
  const arabicCard = page.locator(".match-card").filter({ has: page.locator(".arabic") }).first();
  const pairId = await arabicCard.getAttribute("data-match-card");
  const pairSuffix = pairId.replace(/-ar$/, "");
  await arabicCard.click();
  await expect(page.locator(".match-card.picked")).toHaveCount(1);
  await page.locator(`[data-match-card="${pairSuffix}-ru"]`).click();
  await expect(page.locator(".match-card.matched")).toHaveCount(2);
  await expect(page.locator(".game-hud")).toContainText("1");
});

test(" диктант принимает верное слово", async ({ page }) => {
  await page.goto("/#/practice/dictation");
  await expect(page.locator("#dictationInput")).toBeVisible();
  const expected = await page.locator(".dictation-prompt [data-say]").getAttribute("data-say");
  await page.locator("#dictationInput").fill(expected);
  await page.locator("[data-dictation-check]").click();
  await expect(page.locator("#dictationFeedback.ok")).toBeVisible();
  await expect(page.locator("[data-dictation-next]")).toBeVisible();
});

test(" сборка фраз собирает и проверяет порядок слов", async ({ page }) => {
  await page.goto("/#/practice/builder");
  const count = await page.locator(".builder-token").count();
  expect(count).toBeGreaterThan(1);
  expect(count).toBeLessThan(15);
  await expect(page.locator(".builder-slot.empty")).toBeVisible();
  for (let i = 0; i < count; i += 1) {
    await page.locator(".builder-token:not([disabled])").first().click();
  }
  await expect(page.locator(".builder-selected")).toHaveCount(count);
  await expect(page.locator(".builder-slot.empty")).toHaveCount(0);
  await page.locator("[data-builder-check]").click();
  await expect(page.locator("#builderFeedback")).not.toBeEmpty();
  await page.locator("[data-builder-clear]").click();
  await expect(page.locator(".builder-token:not([disabled])")).toHaveCount(count);
});

test(" квест и аркада не выходят за ширину на телефоне", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  for (const route of ["quest", "achievements", "arcade", "practice/match"]) {
    await page.goto(`/#/${route}`);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, route).toBeLessThanOrEqual(1);
  }
});

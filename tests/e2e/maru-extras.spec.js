import { expect, test } from "@playwright/test";
import { stories } from "../../site/maru-stories-data.js";

test(" словарь без сети ищет по арабскому и русскому", async ({ page }) => {
  await page.goto("/#/offline-dictionary");
  await expect(page.locator(".od-stats")).toBeVisible();
  const total = await page.locator(".od-card").count();
  expect(total).toBeGreaterThan(10);

  await page.locator("#odQuery").fill("قهوة");
  await page.locator("[data-od-search]").click();
  await expect(page.locator(".od-card").first()).toContainText("قهوة");
  expect(await page.locator(".od-card").count()).toBeLessThan(total);

  await page.locator("[data-od-clear]").click();
  await expect(page.locator(".od-card")).toHaveCount(total);
});

test(" словарь без сети фильтрует по букве и избранному", async ({ page }) => {
  await page.goto("/#/offline-dictionary");
  const total = await page.locator(".od-card").count();
  await page.locator('[data-od-letter="ق"]').click();
  expect(await page.locator(".od-card").count()).toBeLessThan(total);
  await page.locator('[data-od-letter="all"]').click();
  await expect(page.locator(".od-card")).toHaveCount(total);

  await page.locator("[data-od-fav]").first().click();
  await expect(page.locator(".od-card .is-favorite")).toHaveCount(1);
  await page.locator("[data-od-favorites]").click();
  await expect(page.locator(".od-card")).toHaveCount(1);
});

test(" список историй открывается постепенно", async ({ page }) => {
  await page.goto("/#/stories");
  await expect(page.locator(".story-card")).toHaveCount(6);
  await expect(page.locator(".story-hero-ring")).toBeVisible();
  await expect(page.locator(".story-card.locked").first()).toBeVisible();
  await expect(page.locator('[data-story-open="cafe"]')).toBeVisible();
  await expect(page.locator('[data-story-open="station"]')).toHaveCount(0);
});

test(" история проходит все реплики, вопросы и сохраняет звёзды", async ({ page }) => {
  const story = stories[0];
  await page.goto("/#/stories");
  await page.locator('[data-story-open="cafe"]').click();

  for (let index = 0; index < story.lines.length; index += 1) {
    await expect(page.locator(".story-line")).toBeVisible();
    await page.locator("[data-story-reveal]").click();
    await expect(page.locator(".story-line-ru.shown")).toBeVisible();
    await page.locator("[data-story-next]").click();
  }

  for (const question of story.questions) {
    await expect(page.locator(".story-question")).toBeVisible();
    await page.locator(`[data-story-choice="${question.answer}"]`).click();
    await expect(page.locator(".game-feedback.ok")).toBeVisible();
    await page.locator("[data-story-next]").click();
  }

  await expect(page.locator(".story-finish")).toBeVisible();
  await expect(page.locator(".story-finish .quest-star.on")).toHaveCount(3);

  await page.goto("/#/stories");
  await expect(page.locator(".story-card.done")).toHaveCount(1);
  await expect(page.locator('.story-card [data-story-open="market"]')).toBeVisible();
});

test(" новые экраны не выходят за ширину на телефоне", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  for (const route of ["offline-dictionary", "stories", "story/cafe"]) {
    await page.goto(`/#/${route}`);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, route).toBeLessThanOrEqual(1);
  }
});

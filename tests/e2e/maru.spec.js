import { expect, test } from "@playwright/test";

test("الصفحة الرئيسية تعرض زر متابعة التعلم بوضوح", async ({ page }) => {
  await page.goto("/#/home");
  const continueButton = page.locator(".continue-button");
  await expect(continueButton).toBeVisible();
  await expect(continueButton).toContainText(/Продолжить|Начать/);
});

test("التنقل السفلي يحتوي على خمسة أقسام منها المحادثة", async ({ page }) => {
  await page.goto("/#/home");
  const routes = await page.locator(".bottom-nav button").evaluateAll((nodes) => nodes.map((node) => node.dataset.route));
  expect(routes).toEqual(["home", "course", "practice", "conversation", "settings"]);
});

test("المحادثة الموجهة تعمل من البداية إلى النهاية", async ({ page }) => {
  await page.goto("/#/conversation");
  await expect(page.locator(".scenario-card").first()).toBeVisible();
  await page.locator(".suggestion-button").first().click();
  await expect(page.locator(".chat-feedback-pill.ok")).toBeVisible();
  await expect(page.locator(".chat-row.learner")).toHaveCount(1);
  await page.locator(".suggestion-button").first().click();
  await expect(page.locator(".chat-row.learner")).toHaveCount(2);
});

test("القاموس يبحث بالعربية والروسية", async ({ page }) => {
  await page.goto("/#/dictionary");
  await page.locator("#dictQuery").fill("صباح الخير");
  await page.locator("[data-dict-search]").click();
  await expect(page.locator(".dictionary-entry").first()).toBeVisible();

  await page.locator("#dictQuery").fill("хочу");
  await page.locator("[data-dict-search]").click();
  await expect(page.locator(".dictionary-entry").first()).toBeVisible();
});

test("تحدي اليوم يعرض أربع مهام", async ({ page }) => {
  await page.goto("/#/challenge");
  await expect(page.locator(".challenge-card")).toHaveCount(4);
});

test("لا يتجاوز المحتوى عرض الشاشة على الهاتف", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/#/home");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test("النصوص العربية والعربية المختلطة لها اتجاه صحيح", async ({ page }) => {
  await page.goto("/#/conversation");
  const direction = await page.locator(".chat-bubble-ar").first().evaluate((node) => getComputedStyle(node).direction);
  expect(direction).toBe("rtl");
});

test("الإعدادات تعرض خيارات الخصوصية", async ({ page }) => {
  await page.goto("/#/settings");
  await expect(page.locator('[data-maru-privacy="recordingsLocal"]')).toBeVisible();
  await expect(page.locator('[data-maru-privacy="cloudSync"]')).toBeVisible();
});

test("رفض إذن الميكروفون لا يكسر التطبيق", async ({ page, context }) => {
  await context.grantPermissions([], { origin: "http://127.0.0.1:8012" });
  await page.goto("/#/conversation");
  await expect(page.locator(".chat-card")).toBeVisible();
});

test("пошаговый урок проходит все восемь шагов", async ({ page }) => {
  await page.goto("/#/guided/m1l1");
  await expect(page.locator(".guided-step")).toHaveCount(8);
  await expect(page.locator(".guided-counter")).toContainText("1 / 8");
  for (let i = 0; i < 7; i += 1) {
    await page.locator("[data-guided-next]").click();
  }
  await expect(page.locator(".guided-counter")).toContainText("8 / 8");
  await expect(page.locator("[data-guided-finish]")).toBeVisible();
});

test("тренажёр произношения открывается и оценивает попытку", async ({ page }) => {
  await page.goto("/#/practice/speak");
  await expect(page.locator(".speaking-grid")).toBeVisible();
  await page.locator('[data-speak-rate="good"]').click();
  await expect(page.locator(".toast")).toBeVisible();
});

test("главная показывает пять слов дня и прогресс", async ({ page }) => {
  await page.goto("/#/home");
  await expect(page.locator(".mini-word-row")).toHaveCount(5);
  await expect(page.locator(".home-tile")).toHaveCount(3);
});

test("аудирование использует записи курса и считает ответы", async ({ page }) => {
  await page.goto("/#/practice/listen");
  await expect(page.locator(".listening-lab")).toBeVisible();
  await expect(page.locator("#listeningExercise option").first()).toHaveAttribute("value", "listen-m1l1");
  await page.locator("[data-listen-answer=\"0\"]").click();
  await expect(page.locator("#listenFeedback .chat-feedback-pill")).toBeVisible();
  await expect(page.locator("[data-listen-next]")).toBeVisible();
});

test("смена упражнения сбрасывает прогресс аудирования", async ({ page }) => {
  await page.goto("/#/practice/listen");
  await page.locator("#listeningExercise").selectOption("listen-m9l1");
  await expect(page.locator(".listening-question h2")).toContainText("кофе");
  await expect(page.locator(".maru-chip")).toContainText("0 / 3");
});

test("дневник слов показывает резервную копию", async ({ page }) => {
  await page.goto("/#/notebook");
  await expect(page.locator(".notebook-section")).toHaveCount(3);
  await expect(page.locator("[data-export-backup]")).toBeVisible();
  await expect(page.locator("[data-export-encrypted]")).toBeVisible();
  await expect(page.locator("#backupFile")).toBeAttached();
});

test("редактор контента проверяет JSON и применяет сценарии", async ({ page }) => {
  await page.goto("/#/admin");
  await expect(page.locator("#adminJson")).toBeVisible();
  await page.locator("#adminJson").fill("{ this is not json }");
  await page.locator("[data-admin-apply]").click();
  await expect(page.locator(".admin-message.warn")).toContainText("Ошибка JSON");
  await page.locator("[data-admin-reset]").click();
  await expect(page.locator(".admin-message.ok")).toBeVisible();
});

test("настройки содержат раздел резервной копии и офлайн-копии", async ({ page }) => {
  await page.goto("/#/settings");
  await expect(page.locator("[data-route=\"notebook\"]")).toBeVisible();
  await expect(page.locator("[data-route=\"offline\"]")).toBeVisible();
  await expect(page.locator("[data-route=\"admin\"]")).toBeVisible();
});

test("диалоги показывают все сценарии", async ({ page }) => {
  await page.goto("/#/conversation");
  await expect(page.locator(".scenario-card")).toHaveCount(40);
});

test("экран готовности офлайн-копии открывается из настроек", async ({ page }) => {
  await page.goto("/#/settings");
  await page.locator('[data-route="offline"]').click();
  await expect(page.locator(".offline-card")).toHaveCount(2);
  await expect(page.locator("[data-cache-check]")).toBeVisible();
  await expect(page.locator("[data-cache-download]")).toBeVisible();
});

test("проверка распознавания речи показывает услышанный текст", async ({ page }) => {
  await page.addInitScript(() => {
    window.SpeechRecognition = class {
      start() {
        this.onresult?.({ results: [[{ transcript: "أهلاً" }]] });
      }
    };
  });
  await page.goto("/#/practice/speak");
  await page.locator("[data-speech-check]").click();
  await expect(page.locator("#speechCheckResult")).toContainText("أهلاً");
  await expect(page.locator("#speechCheckResult")).toContainText("Текст распознан");
});

test("размер шрифта применяется из настроек", async ({ page }) => {
  await page.goto("/#/settings");
  await page.locator('[data-maru-pref="fontSize"]').selectOption("large");
  await expect(page.locator("html")).toHaveAttribute("data-maru-font", "large");
});

test("кнопка «назад» возвращает на предыдущий раздел без потери главной", async ({ page }) => {
  await page.goto("/#/home");
  await expect(page.locator(".continue-button")).toBeVisible();
  await page.locator('.bottom-nav button[data-route="course"]').click();
  await expect(page).toHaveURL(/#\/course$/);
  await page.goBack();
  await expect(page).toHaveURL(/#\/home$/);
  await expect(page.locator(".continue-button")).toBeVisible();
});

test("уведомление об офлайне появляется и исчезает", async ({ page, context }) => {
  await page.goto("/#/home");
  const notice = page.locator("#offlineNotice");
  await expect(notice).toBeHidden();
  await context.setOffline(true);
  await page.evaluate(() => window.dispatchEvent(new Event("offline")));
  await expect(notice).toBeVisible();
  await context.setOffline(false);
  await page.evaluate(() => window.dispatchEvent(new Event("online")));
  await expect(notice).toBeHidden();
});

test("отказ в микрофоне показывает понятное сообщение", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia: () => Promise.reject(new DOMException("Denied", "NotAllowedError")) },
    });
  });
  await page.goto("/#/practice/speak");
  await page.locator("[data-record-say]").first().click();
  await page.locator("#audioRecordPhrase").click();
  await expect(page.locator("#toast")).toContainText("Не удалось получить доступ к микрофону");
});

test("записи остаются после перезагрузки", async ({ page }) => {
  await page.goto("/#/home");
  await page.evaluate(async () => {
    const { putRecording } = await import("/audio-db.js");
    await putRecording("e2e:persist", new Blob(["x"], { type: "audio/webm" }));
  });
  await page.reload();
  const persisted = await page.evaluate(async () => {
    const { getRecording, deleteRecording } = await import("/audio-db.js");
    const record = await getRecording("e2e:persist");
    const ok = !!record && record.size === 1;
    await deleteRecording("e2e:persist");
    return ok;
  });
  expect(persisted).toBe(true);
});

test("старое состояние мигрирует в портал v2 без потери прогресса", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("masri-ru-state-v3", JSON.stringify({
      completed: ["m1l1"], theme: "dark", accent: "blue", xp: 5,
    }));
  });
  await page.goto("/#/home");
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("masri-ru-state-v3")));
  expect(saved.portalVersion).toBe(2);
  expect(saved.theme).toBe("light");
  expect(saved.accent).toBe("emerald");
  expect(saved.completed).toContain("m1l1");
  expect(saved.xp).toBe(5);
});

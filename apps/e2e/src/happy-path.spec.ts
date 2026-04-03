import { expect, test, type Locator, type Page } from '@playwright/test';

const roomName = `E2E sala ${Date.now()}`;

test('happy path con 3 bots y 2 rondas', async ({ page }) => {
  await page.goto('/');

  await click(page.locator('[data-qa="home-create-room-button"]'));
  await click(page.locator('[data-qa="create-room-bots-3"]'));
  await page.locator('input[type="text"]').fill(roomName);
  await click(page.locator('[data-qa="create-room-confirm-button"]'));

  await page.waitForURL(/\/partida\/.+/);
  await expect(page.locator('[data-qa="board-lobby-screen"]')).toBeVisible();
  await expect(page.locator('[data-qa="board-deal-button"]')).toBeVisible();

  await click(page.locator('[data-qa="board-deal-button"]'));

  await playRound(page, 'envido');
  const summary = page.locator('[data-qa="board-round-summary-modal"]');
  const nextRoundButton = page.locator('[data-qa="board-next-round-button"]');

  if (await nextRoundButton.isVisible().catch(() => false)) {
    await click(nextRoundButton);
  }

  await expect(summary).toBeHidden({ timeout: 20_000 });

  await playRound(page, 'truc');
  await expect(
    page.locator('[data-qa="board-round-summary-modal"]'),
  ).toBeVisible();
});

async function playRound(page: Page, betAction: 'envido' | 'truc') {
  const summary = page.locator('[data-qa="board-round-summary-modal"]');
  const activeBet = page.locator('[data-qa="active-bet-banner"]');
  const betButton = page.locator(`[data-qa="action-${betAction}"]`);
  const wantButton = page.locator('[data-qa="action-quiero"]');
  const noWantButton = page.locator('[data-qa="action-no_quiero"]');
  const playableCards = page.locator(
    '[data-qa^="hand-card-"][data-qa-playable="true"]',
  );

  let betSeen = false;
  let safetyCounter = 0;

  while (safetyCounter < 240) {
    if (await summary.isVisible().catch(() => false)) {
      break;
    }

    const activeBetText = (
      (await activeBet.textContent().catch(() => '')) ?? ''
    ).toLowerCase();

    if (!betSeen && activeBetText.includes(betAction)) {
      betSeen = true;
    }

    if (!betSeen && (await betButton.isVisible().catch(() => false))) {
      await click(betButton);
      betSeen = true;
      continue;
    }

    if (await wantButton.isVisible().catch(() => false)) {
      await click(wantButton);
      continue;
    }

    if (await noWantButton.isVisible().catch(() => false)) {
      await click(noWantButton);
      continue;
    }

    const cardCount = await playableCards.count();
    if (cardCount > 0) {
      await playableCards.evaluateAll((elements) => {
        const index = Math.floor(Math.random() * elements.length);
        const element = elements[index] as HTMLElement | undefined;
        element?.click();
      });
      continue;
    }

    if (!betSeen && (await activeBet.isVisible().catch(() => false))) {
      betSeen = true;
    }

    safetyCounter += 1;
    await page.waitForTimeout(250);
  }

  await expect(summary).toBeVisible({ timeout: 60_000 });
  expect(betSeen).toBeTruthy();
}

async function click(locator: Locator) {
  await locator.evaluate((element) => {
    (element as HTMLElement).click();
  });
}

import { expect, test } from '@playwright/test';

test('la sala de espera oculta el reparto hasta completar 4 jugadores', async ({
  page,
}) => {
  await page.goto('/');

  await page.locator('[data-qa="home-create-room-button"]').evaluate((el) => {
    (el as HTMLElement).click();
  });
  await page.locator('[data-qa="create-room-player-name"]').fill('Ana');
  await page
    .locator('[data-qa="create-room-name"]')
    .fill(`Sala sin bots ${Date.now()}`);
  await page
    .locator('[data-qa="create-room-confirm-button"]')
    .evaluate((el) => {
      (el as HTMLElement).click();
    });

  await page.waitForURL(/\/partida\/.+/);
  await expect(page.locator('[data-qa="board-lobby-screen"]')).toBeVisible();
  await expect(page.locator('[data-qa="board-waiting-players"]')).toBeVisible();
  await expect(page.locator('[data-qa="board-deal-button"]')).toHaveCount(0);
});

import { expect, test, type Locator } from '@playwright/test';

const roomName = `Abandono E2E ${Date.now()}`;

test('una desconexion avisa, concede gracia y expulsa la sala', async ({
  browser,
  page,
}) => {
  await page.goto('/');

  await click(page.locator('[data-qa="home-create-room-button"]'));
  await page.locator('[data-qa="create-room-player-name"]').fill('Ana');
  await page.locator('[data-qa="create-room-name"]').fill(roomName);
  await click(page.locator('[data-qa="create-room-confirm-button"]'));

  await page.waitForURL(/\/partida\/.+/);
  const roomUid = new URL(page.url()).pathname.split('/').pop();
  if (!roomUid) {
    throw new Error('Room uid not found');
  }

  const secondContext = await browser.newContext();
  const secondPage = await secondContext.newPage();
  await secondPage.goto('/');

  await expect(
    secondPage.locator(`[data-qa="home-join-room-${roomUid}"]`),
  ).toBeVisible();

  await click(secondPage.locator(`[data-qa="home-join-room-${roomUid}"]`));
  await secondPage.locator('[data-qa="join-room-player-name"]').fill('Bob');
  await click(secondPage.locator('[data-qa="join-room-confirm-button"]'));
  await secondPage.waitForURL(new RegExp(`/partida/${roomUid}$`));

  await secondPage.close();

  await expect(page.getByText(/ha abandonado la sala/i)).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.getByText(/5 minutos de cortesía/i)).toBeVisible();
  await expect(page.locator('[data-qa="board-room-ended-screen"]')).toBeVisible(
    {
      timeout: 10_000,
    },
  );
  await page.waitForURL('/');

  await secondContext.close();
});

async function click(locator: Locator) {
  await locator.evaluate((element) => {
    (element as HTMLElement).click();
  });
}

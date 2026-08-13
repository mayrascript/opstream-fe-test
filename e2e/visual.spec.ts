import { expect, Page, test } from '@playwright/test';

async function prepareVisualPage(page: Page): Promise<void> {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    Math.random = () => ((window as unknown as { failSaves?: boolean }).failSaves ? 0 : 0.99);
  });
}

async function stabilizeVisualFont(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `:root { --ds-font-family: 'Inter Variable', Inter, system-ui, sans-serif; }`,
  });
  await page.evaluate(() => document.fonts.load('16px "Inter Variable"'));
}

async function chooseCategory(page: Page, category: 'Software' | 'Hardware'): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: category }).click();
  await page.getByRole('button', { name: 'Start' }).click();
  await stabilizeVisualFont(page);
}

async function hideTransientSaveState(page: Page): Promise<void> {
  await page.addStyleTag({
    content: '.save-state { visibility: hidden !important; } input { caret-color: transparent; }',
  });
}

test.beforeEach(async ({ page }) => {
  await prepareVisualPage(page);
});

test('schema chooser matches the Figma composition', async ({ page }) => {
  await page.goto('/');
  await stabilizeVisualFont(page);
  await expect(page.getByRole('heading', { name: 'What do you need to purchase?' })).toBeVisible();
  await page.getByRole('button', { name: 'Software' }).click();
  await expect(page).toHaveScreenshot('schema-chooser.png', { animations: 'disabled' });
});

test('Software page one matches the Figma wizard composition', async ({ page }) => {
  await chooseCategory(page, 'Software');
  await expect(page.getByRole('heading', { name: 'Requested Item' })).toBeVisible();
  await hideTransientSaveState(page);
  await expect(page).toHaveScreenshot('software-page-one.png', { animations: 'disabled' });
});

test('Software page two keeps the question-card rhythm', async ({ page }) => {
  await chooseCategory(page, 'Software');
  await page.locator('#question-1758177604').fill('Design collaboration suite');
  await page.locator('#question-75484637462').fill('12');
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('heading', { name: 'Vendor Information' })).toBeVisible();
  await hideTransientSaveState(page);
  await expect(page).toHaveScreenshot('software-page-two.png', { animations: 'disabled' });
});

test('Hardware page one renders the compact toggle treatment', async ({ page }) => {
  await chooseCategory(page, 'Hardware');
  await page.locator('label.toggle').click();
  await expect(page.getByRole('switch', { name: 'Requires shipping' })).toBeChecked();
  await hideTransientSaveState(page);
  await expect(page).toHaveScreenshot('hardware-page-one.png', { animations: 'disabled' });
});

test('summary matches the centered Figma card', async ({ page }) => {
  await chooseCategory(page, 'Software');
  await page.locator('#question-1758177604').fill('Design collaboration suite');
  await page.locator('#question-75484637462').fill('12');
  await page.getByRole('button', { name: 'Next' }).click();
  await page.locator('#question-4957463729').fill('Northstar Software');
  await page.getByLabel('USA').check();
  await page.locator('#question-6482937561').fill('https://example.com');
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page.getByRole('heading', { name: 'Awesome!' })).toBeVisible();
  await expect(page).toHaveScreenshot('request-summary.png', {
    animations: 'disabled',
    mask: [page.locator('.success-mark')],
    maskColor: '#ffffff',
  });
});

test('autosave states remain legible inside a question card', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  await chooseCategory(page, 'Software');
  const card = page.locator('app-dynamic-field').first();
  const input = page.locator('#question-1758177604');

  await input.fill('Saving state');
  await expect(card.getByText('Saving…')).toBeVisible();
  await expect(card).toHaveScreenshot('autosave-saving.png', { animations: 'disabled' });

  await expect(card.getByText('Saved', { exact: true })).toBeVisible({ timeout: 3000 });
  await expect(card).toHaveScreenshot('autosave-saved.png', { animations: 'disabled' });

  await page.evaluate(() => {
    (window as unknown as { failSaves: boolean }).failSaves = true;
  });
  await input.fill('Failing state');
  await expect(card.getByText('Error — retrying…')).toBeVisible({ timeout: 3000 });
  await expect(card).toHaveScreenshot('autosave-retrying.png', { animations: 'disabled' });

  await expect(card.getByText('Not saved', { exact: true })).toBeVisible({ timeout: 5000 });
  await expect(card).toHaveScreenshot('autosave-error.png', { animations: 'disabled' });
});

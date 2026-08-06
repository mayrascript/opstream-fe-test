import { expect, Page, test } from '@playwright/test';

async function useStableSaves(page: Page): Promise<void> {
  await page.addInitScript(() => {
    Math.random = () => ((window as unknown as { failSaves?: boolean }).failSaves ? 0 : 0.99);
  });
}

async function chooseRequest(page: Page, name: 'Software Request' | 'Hardware Request') {
  await page.goto('/');
  await page.getByRole('button', { name: name.replace(' Request', '') }).click();
  await page.getByRole('button', { name: 'Start' }).click();
}

async function completeSoftwareRequest(page: Page): Promise<void> {
  await page.locator('#question-1758177604').fill('Design collaboration suite');
  await page.locator('#question-75484637462').fill('12');
  await page.getByRole('button', { name: 'Next' }).click();
  await page.locator('#question-4957463729').fill('Northstar Software');
  await page.getByLabel('USA').check();
  await page.locator('#question-6482937561').fill('https://example.com');
}

test.beforeEach(async ({ page }) => {
  await useStableSaves(page);
});

test('starts a request with keyboard-only navigation', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'What do you need to purchase?' })).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Software' })).toBeFocused();
  await page.keyboard.press('Space');
  await expect(page.getByRole('button', { name: 'Software' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Start' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Requested item' })).toBeVisible();
});

test('completes the Software request and resets from the read-only summary', async ({ page }) => {
  await chooseRequest(page, 'Software Request');
  await completeSoftwareRequest(page);
  await page.getByRole('button', { name: 'Submit' }).click();

  await expect(page.getByRole('heading', { name: 'Awesome!' })).toBeVisible();
  await expect(page.getByText('Design collaboration suite')).toBeVisible();
  await expect(page.locator('input')).toHaveCount(0);
  await page.getByRole('button', { name: 'Create new request' }).click();
  await expect(page.getByRole('heading', { name: 'What do you need to purchase?' })).toBeVisible();
});

test('completes the Hardware request and preserves answers with Previous', async ({ page }) => {
  await chooseRequest(page, 'Hardware Request');
  await page.locator('#question-75329829348985').fill('Developer laptop');
  await page.locator('#question-85781623672346').fill('2');
  await page.locator('label.toggle').click();
  await expect(page.locator('#question-2389182391823812')).toBeChecked();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Previous' }).click();
  await expect(page.locator('#question-75329829348985')).toHaveValue('Developer laptop');
  await page.getByRole('button', { name: 'Next' }).click();
  await page.locator('#question-9542834823423').fill('Acme Devices');
  await page.getByLabel('UK').check();
  await page.getByRole('button', { name: 'Submit' }).click();

  await expect(page.getByText('Developer laptop')).toBeVisible();
  await expect(page.getByText('Yes')).toBeVisible();
});

test('blocks invalid section navigation and focuses the first field', async ({ page }) => {
  await chooseRequest(page, 'Software Request');
  await page.getByRole('button', { name: 'Next' }).click();

  await expect(page.locator('#question-1758177604')).toBeFocused();
  await expect(page.getByText('This field is required.').first()).toBeVisible();
  await expect(page).toHaveURL(/requested-item$/);
});

test('shows retrying and recovers after a temporary autosave failure', async ({ page }) => {
  await page.addInitScript(() => {
    let calls = 0;
    Math.random = () => {
      calls += 1;
      return calls === 2 ? 0 : 0.99;
    };
  });
  await chooseRequest(page, 'Software Request');
  await page.locator('#question-1758177604').fill('Temporary failure');

  await expect(page.getByText('Error — retrying…')).toBeVisible({ timeout: 3000 });
  await expect(page.getByText('Saved')).toBeVisible({ timeout: 4000 });
});

test('keeps final submission blocked until a failed answer is retried', async ({ page }) => {
  await chooseRequest(page, 'Software Request');
  await completeSoftwareRequest(page);
  await expect(page.getByText('Saved')).toHaveCount(3, { timeout: 4000 });

  await page.evaluate(() => {
    (window as unknown as { failSaves: boolean }).failSaves = true;
  });
  await page.locator('#question-4957463729').fill('Failing vendor');
  await expect(page.getByText('Not saved')).toBeVisible({ timeout: 5000 });
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page).toHaveURL(/vendor-info$/);
  await expect(page.getByText(/could not be saved/i)).toBeVisible();

  await page.evaluate(() => {
    (window as unknown as { failSaves: boolean }).failSaves = false;
  });
  await page.getByRole('button', { name: 'Retry' }).click();
  await expect(page.getByText('Saved')).toHaveCount(3, { timeout: 3000 });
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page.getByRole('heading', { name: 'Awesome!' })).toBeVisible();
});

test('redirects a reloaded request route when its in-memory session is gone', async ({ page }) => {
  await page.goto('/request/software-request/requested-item');
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { name: 'What do you need to purchase?' })).toBeVisible();
});

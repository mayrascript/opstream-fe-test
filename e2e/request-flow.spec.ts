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
  await expect(page.getByRole('heading', { name: 'Requested Item' })).toBeFocused();
});

test('completes the Software request and resets from the read-only summary', async ({ page }) => {
  await chooseRequest(page, 'Software Request');
  await completeSoftwareRequest(page);
  await page.getByRole('button', { name: 'Submit' }).click();

  await expect(page.getByRole('heading', { name: 'Awesome!' })).toBeFocused();
  await expect(page.getByText('Design collaboration suite')).toBeVisible();
  await expect(page.locator('input')).toHaveCount(0);
  await page.getByRole('button', { name: 'Create new request' }).click();
  await expect(page.getByRole('heading', { name: 'What do you need to purchase?' })).toBeFocused();
});

test('completes the Hardware request and preserves answers with Previous', async ({ page }) => {
  await chooseRequest(page, 'Hardware Request');
  await page.locator('#question-75329829348985').fill('Developer laptop');
  await page.locator('#question-85781623672346').fill('2');
  await page.getByRole('switch', { name: 'Requires shipping' }).check();
  await expect(page.locator('#question-2389182391823812')).toBeChecked();
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('heading', { name: 'Vendor Information' })).toBeFocused();
  await page.getByRole('button', { name: 'Previous' }).click();
  await expect(page.getByRole('heading', { name: 'Requested Item' })).toBeFocused();
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

test('uses the page rail with pointer and keyboard while enforcing forward validation', async ({
  page,
}) => {
  await chooseRequest(page, 'Software Request');
  const pageOne = page.getByRole('button', { name: /Page 1.*Requested Item/i });
  const pageTwo = page.getByRole('button', { name: /Page 2.*Vendor Information/i });

  await expect(pageOne).toHaveAttribute('aria-current', 'step');
  await pageTwo.click();
  await expect(page).toHaveURL(/requested-item$/);
  await expect(page.locator('#question-1758177604')).toBeFocused();

  await page.locator('#question-1758177604').fill('Design software');
  await page.locator('#question-75484637462').fill('2');
  await pageTwo.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/vendor-info$/);
  await expect(page.getByRole('heading', { name: 'Vendor Information' })).toBeFocused();
  await expect(page.getByRole('radio')).toHaveCount(3);
  await expect(page.getByLabel('USA')).toBeVisible();

  await pageOne.focus();
  await page.keyboard.press('Space');
  await expect(page).toHaveURL(/requested-item$/);
  await expect(page.getByRole('heading', { name: 'Requested Item' })).toBeFocused();
});

test('accepts numeric zero when the schema declares no minimum', async ({ page }) => {
  await chooseRequest(page, 'Software Request');
  await page.locator('#question-1758177604').fill('Design software');
  await page.locator('#question-75484637462').fill('0');
  await page.getByRole('button', { name: 'Next' }).click();

  await expect(page).toHaveURL(/vendor-info$/);
});

test('restores heading focus when browser history changes the active section', async ({ page }) => {
  await chooseRequest(page, 'Software Request');
  await page.locator('#question-1758177604').fill('Design software');
  await page.locator('#question-75484637462').fill('1');
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('heading', { name: 'Vendor Information' })).toBeFocused();

  await page.goBack();
  await expect(page.getByRole('heading', { name: 'Requested Item' })).toBeFocused();
});

test('clicking a visible field label focuses its native control', async ({ page }) => {
  await chooseRequest(page, 'Hardware Request');
  const itemName = page.locator('#question-75329829348985');
  await page.locator('label[for="question-75329829348985"]').click();
  await expect(itemName).toBeFocused();

  const shippingToggle = page.locator('#question-2389182391823812');
  await page.locator('#question-2389182391823812-label').click();
  await expect(shippingToggle).toBeFocused();
});

test('validates the entire request before a direct final-section submission', async ({ page }) => {
  await chooseRequest(page, 'Software Request');
  await page.evaluate(() => {
    window.history.pushState({}, '', '/request/software-request/vendor-info');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  await expect(page).toHaveURL(/vendor-info$/);
  await page.locator('#question-4957463729').fill('Northstar Software');
  await page.getByLabel('USA').check();
  await page.getByRole('button', { name: 'Submit' }).click();

  await expect(page).toHaveURL(/requested-item$/);
  await expect(page.locator('#question-1758177604')).toBeFocused();
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
  await expect(page.getByText('Saved', { exact: true })).toBeVisible({ timeout: 4000 });
});

test('keeps final submission blocked until a failed answer is retried', async ({ page }) => {
  await chooseRequest(page, 'Software Request');
  await completeSoftwareRequest(page);
  await expect(page.getByText('Saved', { exact: true })).toHaveCount(3, { timeout: 4000 });

  await page.evaluate(() => {
    (window as unknown as { failSaves: boolean }).failSaves = true;
  });
  await page.locator('#question-4957463729').fill('Failing vendor');
  await expect(page.getByText('Not saved', { exact: true })).toBeVisible({ timeout: 5000 });
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page).toHaveURL(/vendor-info$/);
  await expect(page.getByText(/could not be saved/i)).toBeVisible();
  const retry = page.getByRole('button', { name: /Retry saving Vendor/i });
  await expect(retry).toBeFocused();

  await page.evaluate(() => {
    (window as unknown as { failSaves: boolean }).failSaves = false;
  });
  await retry.click();
  const pendingRetry = page.locator('[data-save-retry]');
  await expect(pendingRetry).toBeFocused();
  await expect(pendingRetry).toHaveAttribute('aria-disabled', 'true');
  await expect(page.getByText('Saved', { exact: true })).toHaveCount(3, { timeout: 3000 });
  await expect(page.locator('[role="group"][aria-label="Vendor Name save status"]')).toBeFocused();
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page.getByRole('heading', { name: 'Awesome!' })).toBeVisible();
});

test('completes the primary workflow without browser runtime errors', async ({ page }) => {
  const runtimeErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') {
      runtimeErrors.push(`console: ${message.text()}`);
    }
  });
  page.on('pageerror', (error) => runtimeErrors.push(`page: ${error.message}`));

  await chooseRequest(page, 'Software Request');
  await completeSoftwareRequest(page);
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page.getByRole('heading', { name: 'Awesome!' })).toBeVisible();

  expect(runtimeErrors).toEqual([]);
});

test('redirects a reloaded request route when its in-memory session is gone', async ({ page }) => {
  await page.goto('/request/software-request/requested-item');
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { name: 'What do you need to purchase?' })).toBeVisible();
});

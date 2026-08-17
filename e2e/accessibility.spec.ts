import AxeBuilder from '@axe-core/playwright';
import { expect, Page, test } from '@playwright/test';

async function expectNoAccessibilityViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page }).analyze();

  expect(results.violations).toEqual([]);
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    Math.random = () => 0.99;
  });
});

test('schema chooser has no detectable WCAG 2.2 AA violations', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'What do you need to purchase?' })).toBeVisible();
  await expect(page.locator('.chooser-page')).toHaveAttribute('aria-labelledby', 'chooser-title');
  await expect(page.locator('.chooser-page')).not.toHaveAttribute('aria-label', /.+/);
  await expectNoAccessibilityViolations(page);
  await page.getByRole('button', { name: 'Software' }).click();
  await expectNoAccessibilityViolations(page);
});

test('dynamic request fields and validation have no detectable WCAG 2.2 AA violations', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Hardware' }).click();
  await page.getByRole('button', { name: 'Start' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.locator('#question-75329829348985')).toBeFocused();
  await expectNoAccessibilityViolations(page);
});

test('completed summary has no detectable WCAG 2.2 AA violations', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Software' }).click();
  await page.getByRole('button', { name: 'Start' }).click();
  await page.locator('#question-1758177604').fill('Design collaboration suite');
  await page.locator('#question-75484637462').fill('2');
  await page.getByRole('button', { name: 'Next' }).click();
  await page.locator('#question-4957463729').fill('Northstar Software');
  await page.getByLabel('USA').check();
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page.getByRole('heading', { name: 'Awesome!' })).toBeVisible();

  await expectNoAccessibilityViolations(page);
});

import AxeBuilder from '@axe-core/playwright';
import { expect, Page, test } from '@playwright/test';

async function expectNoAccessibilityViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();

  expect(results.violations).toEqual([]);
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    Math.random = () => 0.99;
  });
});

test('schema chooser has no detectable WCAG 2.2 AA violations', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'What are you requesting?' })).toBeVisible();
  await expectNoAccessibilityViolations(page);
});

test('dynamic request fields and validation have no detectable WCAG 2.2 AA violations', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Hardware Request/ }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.locator('#question-75329829348985')).toBeFocused();
  await expectNoAccessibilityViolations(page);
});

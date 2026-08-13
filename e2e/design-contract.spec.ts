import { expect, Page, test } from '@playwright/test';

type Rect = { x: number; y: number; width: number; height: number };

function expectNear(actual: number, expected: number, tolerance = 1): void {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance);
}

async function rect(page: Page, selector: string): Promise<Rect> {
  const value = await page.locator(selector).boundingBox();
  expect(value).not.toBeNull();
  return value!;
}

async function computed(page: Page, selector: string) {
  return page.locator(selector).evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      backgroundColor: style.backgroundColor,
      borderColor: style.borderColor,
      borderRadius: style.borderRadius,
      boxShadow: style.boxShadow,
      color: style.color,
      fontFamily: style.fontFamily,
      outlineColor: style.outlineColor,
      outlineOffset: style.outlineOffset,
      outlineWidth: style.outlineWidth,
      padding: style.padding,
    };
  });
}

async function chooseSoftware(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: 'Software' }).click();
  await page.getByRole('button', { name: 'Start' }).click();
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    Math.random = () => 0.99;
  });
});

test('selector resolves the measured desktop design contract', async ({ page, viewport }) => {
  test.skip(viewport?.width !== 1440);
  await page.goto('/');
  await page.getByRole('button', { name: 'Software' }).click();

  const card = await rect(page, '.chooser-card');
  expectNear(card.x, 205.5);
  expectNear(card.y, 152);
  expectNear(card.width, 1029);
  expectNear(card.height, 489);

  const content = await rect(page, '.chooser-content');
  expectNear(content.y, 208);
  expectNear(content.width, 885);
  expectNear(content.height, 240);

  const prompt = await rect(page, '#chooser-title');
  expectNear(prompt.y, 240);
  expectNear(prompt.height, 30);
  const selectedChip = await rect(page, '.schema-chip.is-selected');
  const unselectedChip = await rect(page, '.schema-chip:not(.is-selected)');
  const start = await rect(page, '.start-button');
  expectNear(selectedChip.width, 111, 2);
  expectNear(selectedChip.height, 32);
  expectNear(unselectedChip.width, 116, 2);
  expectNear(unselectedChip.height, 42);
  expectNear(start.y, 376);
  expectNear(start.width, 65, 1);
  expectNear(start.height, 40);

  const cardStyle = await computed(page, '.chooser-card');
  expect(cardStyle.backgroundColor).toBe('rgb(255, 255, 255)');
  expect(cardStyle.borderRadius).toBe('25px');
  expect(cardStyle.padding).toBe('56px 72px');
  expect((await computed(page, 'html')).fontFamily).toContain('Inter Variable');
});

test('wizard resolves the measured desktop design contract', async ({ page, viewport }) => {
  test.skip(viewport?.width !== 1440);
  await chooseSoftware(page);

  const navigation = await rect(page, 'app-wizard-progress nav');
  const panel = await rect(page, '.form-panel');
  const heading = await rect(page, '.section-heading h1');
  const card = await rect(page, '.fields app-dynamic-field:first-child .field-shell');
  const input = await rect(page, '#question-1758177604');
  const action = await rect(page, '.form-actions app-button:last-child button');

  expectNear(navigation.x, 190);
  expectNear(navigation.y, 158);
  expectNear(navigation.width, 250);
  expectNear(panel.x, 472);
  expectNear(panel.y, 158);
  expectNear(panel.width, 704);
  expectNear(heading.height, 27);
  expectNear(card.y, 197);
  expectNear(card.width, 704);
  expectNear(card.height, 125);
  expectNear(input.x, 496);
  expectNear(input.y, 250);
  expectNear(input.width, 656);
  expectNear(input.height, 48);
  expectNear(action.x, 472);
  expectNear(action.height, 32);

  const cardStyle = await computed(page, '.fields app-dynamic-field:first-child .field-shell');
  expect(cardStyle.borderRadius).toBe('8px');
  expect(cardStyle.padding).toBe('24px');
  expect(cardStyle.boxShadow).not.toBe('none');
  expect((await computed(page, '#question-1758177604')).borderColor).toBe('rgb(116, 121, 128)');
  await page.locator('#question-1758177604').focus();
  const focusedInputStyle = await computed(page, '#question-1758177604');
  expect(focusedInputStyle.outlineColor).toBe('rgb(8, 121, 101)');
  expect(focusedInputStyle.outlineWidth).toBe('3px');
  expect(focusedInputStyle.outlineOffset).toBe('3px');
});

test('summary resolves the measured desktop design contract', async ({ page, viewport }) => {
  test.skip(viewport?.width !== 1440);
  await chooseSoftware(page);
  await page.locator('#question-1758177604').fill('Design collaboration suite');
  await page.locator('#question-75484637462').fill('2');
  await page.getByRole('button', { name: 'Next' }).click();
  await page.locator('#question-4957463729').fill('Northstar Software');
  await page.getByLabel('USA').check();
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page.getByRole('heading', { name: 'Awesome!' })).toBeVisible();

  const card = await rect(page, '.summary-card');
  const hero = await rect(page, '.summary-hero');
  const details = await rect(page, '.summary-details');
  const firstRow = await rect(page, 'dl div:first-child');
  const action = await rect(page, 'footer button');

  expectNear(card.x, 416);
  expectNear(card.y, 99);
  expectNear(card.width, 720);
  expect(card.height).toBeGreaterThanOrEqual(750);
  expect(card.height).toBeLessThan(850);
  expectNear(hero.width, 384);
  expectNear(hero.height, 269, 2);
  expectNear(details.x, 488);
  expectNear(details.width, 576);
  expectNear(firstRow.height, 45);
  expectNear(action.height, 40);

  const cardStyle = await computed(page, '.summary-card');
  expect(cardStyle.borderRadius).toBe('8px');
  expect(cardStyle.padding).toBe('56px 72px');
});

test('mobile wizard rows size to content without the previous vertical void', async ({
  page,
  viewport,
}) => {
  test.skip(viewport?.width !== 390);
  await chooseSoftware(page);

  const navigation = await rect(page, '.progress-panel');
  const panel = await rect(page, '.form-panel');
  expectNear(navigation.x, 16);
  expectNear(panel.x, 16);
  expectNear(panel.y - (navigation.y + navigation.height), 24, 2);
});

test('tablet wizard uses the compact rail and fluid form composition', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  await page.setViewportSize({ width: 1024, height: 900 });
  await chooseSoftware(page);

  const navigation = await rect(page, 'app-wizard-progress nav');
  const panel = await rect(page, '.form-panel');
  expectNear(navigation.width, 200);
  expectNear(panel.x - (navigation.x + navigation.width), 24, 2);
  expect(panel.width).toBeGreaterThan(600);
  expect(panel.x + panel.width).toBeLessThanOrEqual(1008);
});

import { test, expect } from '@playwright/test';

test.describe('Document Viewer & Jump-to-Source (FR-21, FR-22)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should render the loaded sample PDF and page controls', async ({ page }) => {
    await expect(page.locator('.viewer-wrapper')).toBeVisible();
    await expect(page.locator('.viewer-toolbar')).toBeVisible();
    await expect(page.locator('.viewer-info')).toContainText(/Page 1 of/i);
  });

  test('should switch between sample contract PDFs via dropdown', async ({ page }) => {
    const selector = page.getByLabel('Select sample contract');
    await selector.selectOption('employment_offer.pdf');
    await expect(page.getByText('Vertical: employment')).toBeVisible();
  });

  test('should display out-of-scope fallback when question cannot be answered', async ({ page }) => {
    const input = page.getByPlaceholder(/Can my landlord deduct/i);
    // Ask a completely ungrounded question
    await input.fill('What is the capital of France and how to bake a pizza?');
    await page.keyboard.press('Enter');

    // Expect exact verbatim out-of-scope string per Challenge Spec (Section 11)
    await expect(page.getByText('This cannot be determined from the information you provided.')).toBeVisible();
  });
});

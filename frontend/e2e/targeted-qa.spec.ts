import { test, expect } from '@playwright/test';

test.describe('Targeted Q&A Hero Flow (FR-20, FR-21, FR-22)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should render the hero screen with navbar and targeted Q&A', async ({ page }) => {
    await expect(page.locator('.brand-title')).toContainText('PaperTrail');
    await expect(page.getByRole('button', { name: 'Targeted Q&A' })).toBeVisible();
    await expect(page.getByPlaceholder(/Can my landlord deduct/i)).toBeVisible();
  });

  test('should ask a question and receive a grounded answer with citations', async ({ page }) => {
    const input = page.getByPlaceholder(/Can my landlord deduct/i);
    await input.fill('What is the notice period for terminating this agreement?');
    await page.keyboard.press('Enter');

    // Expect verified answer card to appear
    await expect(page.locator('.status-badge')).toBeVisible();
    await expect(page.locator('.citation-pill').first()).toBeVisible();
  });

  test('should jump to citation when clicking citation badge', async ({ page }) => {
    const input = page.getByPlaceholder(/Can my landlord deduct/i);
    await input.fill('What is the security deposit?');
    await page.keyboard.press('Enter');

    const citationPill = page.locator('.citation-pill').first();
    await expect(citationPill).toBeVisible();
    await citationPill.click();

    // Verify citation target triggered in the preview/viewer
    await expect(page.locator('.panel-viewer')).toBeVisible();
  });

  test('should switch between tabs smoothly', async ({ page }) => {
    await page.getByRole('button', { name: 'Health Report' }).click();
    await expect(page.getByRole('heading', { name: /Document Health & Risk Report/i })).toBeVisible();

    await page.getByRole('button', { name: 'Compare' }).click();
    await expect(page.getByRole('heading', { name: /Document Comparison/i })).toBeVisible();

    await page.getByRole('button', { name: 'Legal Aid (DLSA)' }).click();
    await expect(page.getByRole('heading', { name: /Legal Aid Navigator/i })).toBeVisible();

    await page.getByRole('button', { name: 'Notice Drafter' }).click();
    await expect(page.getByRole('heading', { name: /Notice Drafter/i })).toBeVisible();
  });
});

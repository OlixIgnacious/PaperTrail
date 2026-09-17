import { test, expect } from '@playwright/test';

test.describe('PaperTrail UX Gaps & High-Impact Enhancements', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display dynamic context-aware starter questions tailored to the active vertical', async ({ page }) => {
    // Initial document is rental -> questions should include deposit/rent/lease terms
    await expect(page.getByRole('button', { name: /What is the notice period for terminating this lease agreement/i })).toBeVisible();

    // Switch to Employment contract via sample dropdown
    const sampleSelect = page.getByLabel('Select sample contract');
    await sampleSelect.selectOption('employment_offer.pdf');

    // Questions should now dynamically update to employment/non-compete/salary questions
    await expect(page.getByRole('button', { name: /non-compete clause legally enforceable/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /forfeit earned salary/i })).toBeVisible();

    // Switch to Gig Partner terms
    await sampleSelect.selectOption('gig_platform_terms.pdf');
    await expect(page.getByRole('button', { name: /arbitrarily deactivate/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /commission fees under MoRTH/i })).toBeVisible();
  });

  test('should support Copy Answer and 1-click Draft Notice CTA from Q&A response', async ({ page }) => {
    // Ask the first starter question
    const questionBtn = page.getByRole('button', { name: /What is the notice period for terminating this lease agreement/i });
    await questionBtn.click();

    // Wait for response card to be visible
    await expect(page.locator('.status-badge')).toBeVisible({ timeout: 40000 });

    // Test Copy Answer button
    const copyBtn = page.getByRole('button', { name: /Copy Answer/i });
    await expect(copyBtn).toBeVisible();
    await copyBtn.click();
    await expect(page.getByRole('button', { name: 'Copied!' })).toBeVisible();

    // Test 1-click legal remedy CTA "Draft Statutory Demand Notice"
    const draftNoticeBtn = page.getByRole('button', { name: 'Draft Statutory Demand Notice' });
    await expect(draftNoticeBtn).toBeVisible();
    await draftNoticeBtn.click();

    // Verifies it navigated directly to the Notice Drafter tab
    await expect(page.getByRole('heading', { name: /Notice Drafter/i })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Print / Save PDF' })).toBeVisible();
  });

  test('should provide Download (.txt) button in Notice Drafter', async ({ page }) => {
    await page.getByRole('button', { name: 'Notice Drafter' }).click();
    await expect(page.getByRole('heading', { name: /Notice Drafter/i })).toBeVisible();

    // Verify Download (.txt) button exists
    const downloadBtn = page.getByRole('button', { name: 'Download (.txt)' });
    await expect(downloadBtn).toBeVisible();
  });

  test('should provide Print / Save PDF Report button in Document Health Report', async ({ page }) => {
    await page.getByRole('button', { name: 'Health Report' }).click();
    await expect(page.getByRole('heading', { name: 'Document Health & Risk Report' })).toBeVisible();

    // Verify Print Report button exists
    const printBtn = page.getByRole('button', { name: 'Print / Save PDF Report' });
    await expect(printBtn).toBeVisible();
  });
});

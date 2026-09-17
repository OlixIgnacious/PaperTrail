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

  test('should support 1-click WhatsApp Share and multi-turn session conversation tracking', async ({ page }) => {
    // Ask starter question
    const questionBtn = page.getByRole('button', { name: /What is the notice period for terminating this lease agreement/i });
    await questionBtn.click();

    // Wait for response
    await expect(page.locator('.status-badge')).toBeVisible({ timeout: 40000 });

    // Verify Share via WhatsApp button is present
    const whatsappBtn = page.getByRole('button', { name: /Share via WhatsApp/i });
    await expect(whatsappBtn).toBeVisible();

    // Verify Session Conversation banner appears with 1 query
    await expect(page.getByText(/Session Conversation \(1 query\)/i)).toBeVisible();

    // Ask a second question
    const input = page.getByLabel('Legal question input');
    await input.fill('Can this notice period be waived?');
    await page.getByRole('button', { name: 'Send Question' }).click();

    // Verify Session Conversation updates to 2 queries
    await expect(page.getByText(/Session Conversation \(2 queries\)/i)).toBeVisible({ timeout: 40000 });

    // Verify Reset Context button clears session conversation
    const resetBtn = page.getByRole('button', { name: /Reset Context/i });
    await expect(resetBtn).toBeVisible();
    await resetBtn.click();
    await expect(page.getByText(/Session Conversation/i)).not.toBeVisible();
  });

  test('should support direct contract text paste and clause extraction (FR-1)', async ({ page }) => {
    // Open Upload Modal
    await page.getByRole('button', { name: /Upload Document/i }).first().click();
    await expect(page.getByRole('heading', { name: 'Upload Legal Document' })).toBeVisible();

    // Switch to Paste Contract Text tab (FR-1)
    await page.getByRole('button', { name: /Paste Contract Text \(FR-1\)/i }).click();

    // Select sample excerpt 'Tenancy Deposit Terms'
    await page.getByRole('button', { name: 'Tenancy Deposit Terms' }).click();

    // Verify textarea populated
    const textarea = page.getByLabel('Contract text input');
    await expect(textarea).not.toBeEmpty();

    // Click Extract & Analyze Clauses
    await page.getByRole('button', { name: /Extract & Analyze Clauses/i }).click();

    // Modal should close and active document header should display pasted title
    await expect(page.getByRole('heading', { name: 'Upload Legal Document' })).not.toBeVisible();
    await expect(page.locator('.active-doc-bar')).toContainText('Residential Tenancy Agreement');
    await expect(page.locator('.active-doc-bar')).toContainText('clauses');
    await expect(page.locator('.active-doc-bar')).toContainText('rental');
  });

  test('should support Prepare for Lawyer & Action Checklist modal (Use Cases 5, 6, 7)', async ({ page }) => {
    // Ask a starter question to get an answer card
    const questionBtn = page.getByRole('button', { name: /What is the notice period for terminating this lease agreement/i });
    await questionBtn.click();
    await expect(page.locator('.status-badge')).toBeVisible({ timeout: 40000 });

    // Click "Prepare for Lawyer & Action Checklist" button
    const prepBtn = page.getByRole('button', { name: /Prepare for Lawyer & Action Checklist/i });
    await expect(prepBtn).toBeVisible();
    await prepBtn.click();

    // Verify modal elements
    await expect(page.getByRole('heading', { name: 'Prepare for a Legal Professional & Action Checklist' })).toBeVisible();
    await expect(page.getByText(/Legal Assistance Notice:/i)).toBeVisible();
    await expect(page.getByText(/Evidentiary Document Checklist/i)).toBeVisible();
    await expect(page.getByText(/Key Questions to Ask Your Advocate/i)).toBeVisible();

    // Verify Copy Lawyer Brief and Share via WhatsApp buttons
    const copyBriefBtn = page.getByRole('button', { name: /Copy Lawyer Brief/i });
    await expect(copyBriefBtn).toBeVisible();
    await copyBriefBtn.click();
    await expect(page.getByRole('button', { name: /Copied Brief!/i })).toBeVisible();

    // Close modal
    await page.getByRole('button', { name: 'Close', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Prepare for a Legal Professional & Action Checklist' })).not.toBeVisible();
  });
});




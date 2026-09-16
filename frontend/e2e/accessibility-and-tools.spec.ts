import { test, expect } from '@playwright/test';

test.describe('PaperTrail Extended Workflows & Accessibility (FR-12, FR-13, FR-14, FR-15)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display language selector with 15 scheduled Indian languages and voice input', async ({ page }) => {
    // Language dropdown exists and has options
    const langSelect = page.getByLabel('Select translation language');
    await expect(langSelect).toBeVisible();
    await expect(langSelect).toContainText('Hindi');
    await expect(langSelect).toContainText('Tamil');
    await expect(langSelect).toContainText('Telugu');
    await expect(langSelect).toContainText('Bengali');

    // Switch language to Hindi
    await langSelect.selectOption('hi');
    await expect(langSelect).toHaveValue('hi');

    // STT Voice button exists on the search input
    await expect(page.getByLabel(/voice input|start voice/i)).toBeVisible();
  });

  test('should evaluate Section 12 eligibility and search DLSA directory', async ({ page }) => {
    await page.getByRole('button', { name: 'Legal Aid (DLSA)' }).click();
    await expect(page.getByRole('heading', { name: /Legal Aid Navigator/i })).toBeVisible();

    // Verify NALSA 24x7 helpline 15100 banner
    await expect(page.locator('text=15100').first()).toBeVisible();

    // Check a Section 12 criteria box (Woman or Child)
    const womanCheckbox = page.locator('input[type="checkbox"]').first();
    await womanCheckbox.check();

    // Verify eligibility status card updates
    await expect(page.getByText(/Statutorily Eligible for Free Legal Aid/i)).toBeVisible();

    // Search district directory
    const searchInput = page.getByPlaceholder(/Search state or city/i);
    await searchInput.fill('Bengaluru');

    // Expect Bengaluru Urban DLSA entry to remain visible
    await expect(page.getByText(/Bengaluru Urban/i)).toBeVisible();
    await expect(page.getByText(/City Civil Court Complex/i)).toBeVisible();
  });

  test('should draft a legal notice with template customization and copy/print controls', async ({ page }) => {
    await page.getByRole('button', { name: 'Notice Drafter' }).click();
    await expect(page.getByRole('heading', { name: /Notice Drafter/i })).toBeVisible();

    // Select rental deposit notice
    await page.getByRole('button', { name: /Demand for Refund of Security Deposit/i }).click();

    // Modify Sender Name input
    const senderInput = page.locator('label:has-text("Sender Name") + input');
    await expect(senderInput).toBeVisible();
    await senderInput.fill('Aarav Sharma');

    // Verify live preview textarea updates with custom name
    const previewArea = page.locator('textarea');
    await expect(previewArea).toHaveValue(/Aarav Sharma/);

    // Verify Copy Notice and Print Notice buttons exist
    await expect(page.getByRole('button', { name: /Copy Notice/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Print \/ Save PDF/i })).toBeVisible();

    // Verify "Ready to Print & Post" RPAD guidance
    await expect(page.getByText(/Postal Dispatch Guidance/i)).toBeVisible();
  });

  test('should render Document Health Report with risk score and conflict audit', async ({ page }) => {
    await page.getByRole('button', { name: 'Health Report' }).click();
    await expect(page.getByRole('heading', { name: /Document Health & Risk Report/i })).toBeVisible();

    // Verify Statutory Risk Score gauge is displayed
    await expect(page.getByText(/Statutory Risk Score/i)).toBeVisible();

    // Verify Zero Document Persistence guarantee is explicitly stated
    await expect(page.getByText(/Zero Document Persistence \(NFR-1 Compliant\)/i)).toBeVisible();
  });
});

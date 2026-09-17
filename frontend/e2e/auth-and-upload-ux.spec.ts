import { test, expect } from '@playwright/test';

test.describe('PaperTrail Auth & Document Upload UX Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the Active Contract Context Bar with clause count and vertical tag', async ({ page }) => {
    const activeDocBar = page.locator('.active-doc-bar');
    await expect(activeDocBar).toBeVisible();
    await expect(activeDocBar).toContainText('Active Contract:');
    await expect(activeDocBar).toContainText('Rental Lease');
    await expect(activeDocBar).toContainText('rental');
  });

  test('should open upload modal, dismiss with Escape key, and support sample preset chips', async ({ page }) => {
    // Open upload modal via navbar (exact: true to differentiate from 'Replace / Upload Document')
    await page.getByRole('button', { name: 'Upload Document', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Upload Legal Document' })).toBeVisible();
    await expect(page.getByText('Zero-Persistence Privacy (NFR-1)')).toBeVisible();

    // Test Escape key dismissal
    await page.keyboard.press('Escape');
    await expect(page.getByRole('heading', { name: 'Upload Legal Document' })).not.toBeVisible();

    // Reopen upload modal
    await page.getByRole('button', { name: 'Upload Document', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Upload Legal Document' })).toBeVisible();

    // Click sample preset "Gig Terms"
    await page.getByRole('button', { name: 'Gig Terms' }).click();

    // Modal closes and active document bar updates
    await expect(page.getByRole('heading', { name: 'Upload Legal Document' })).not.toBeVisible();
    const activeDocBar = page.locator('.active-doc-bar');
    await expect(activeDocBar).toContainText('Gig Partner Terms');
    await expect(activeDocBar).toContainText('gig');
  });

  test('should support user registration, update navbar with profile, and prefill name in Notice Drafter', async ({ page }) => {
    // Open Sign In modal
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page.getByRole('heading', { name: 'Sign in to PaperTrail' })).toBeVisible();

    // Switch to Register tab
    await page.getByRole('button', { name: 'Register' }).click();
    await expect(page.getByRole('heading', { name: 'Create an Account' })).toBeVisible();

    // Fill form
    await page.getByPlaceholder('e.g. Aarav Sharma').fill('Priya Sharma');
    await page.getByPlaceholder('name@example.com').fill('priya@example.com');
    await page.getByPlaceholder('••••••••').fill('password123');

    // Submit registration button
    await page.getByRole('button', { name: 'Create Account' }).click();

    // Modal closes and navbar displays user name
    await expect(page.getByRole('heading', { name: 'Create an Account' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: /Priya/i })).toBeVisible();

    // Switch to Notice Drafter tab
    await page.getByRole('button', { name: 'Notice Drafter' }).click();
    await expect(page.getByRole('heading', { name: /Notice Drafter/i })).toBeVisible();

    // Sender Name input should now be pre-filled with "Priya Sharma"
    const senderInput = page.locator('label:has-text("Sender Name") + input');
    await expect(senderInput).toHaveValue('Priya Sharma');
  });
});

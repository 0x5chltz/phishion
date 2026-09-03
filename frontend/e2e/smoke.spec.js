import { expect, test } from '@playwright/test';

test('core public pages render', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Phishion' }).first()).toBeVisible();

  await page.goto('/login');
  await expect(page.getByText('Sign in with Google')).toBeVisible();
  await expect(page.getByLabel('Password')).toHaveCount(0);

  await page.goto('/domains');
  await expect(page.getByRole('heading', { name: 'Subdomain Discovery' })).toBeVisible();
});

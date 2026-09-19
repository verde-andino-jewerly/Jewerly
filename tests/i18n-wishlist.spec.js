// @ts-check
const { test, expect } = require('@playwright/test');
const { mockSupabase, forceLocaleES, LOCALE_KEY, WISHLIST_KEY } = require('./fixtures/productos');

test.describe('i18n ES ↔ EN', () => {
  test.beforeEach(async ({ page }) => {
    await mockSupabase(page);
    await forceLocaleES(page);
  });

  test('cambiar a EN traduce el hero', async ({ page }) => {
    await page.goto('/');
    const heroEs = await page.locator('.hero-sub').textContent();
    expect(heroEs).toMatch(/esmeraldas/i);
    await page.evaluate(() => window.toggleLocale && window.toggleLocale());
    const heroEn = await page.locator('.hero-sub').textContent();
    expect(heroEn).not.toEqual(heroEs);
    const locale = await page.evaluate((k) => localStorage.getItem(k), LOCALE_KEY);
    expect(locale).toBe('en');
  });

  test('el idioma persiste tras recargar', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.toggleLocale && window.toggleLocale());
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });
});

test.describe('Wishlist (favoritos)', () => {
  test.beforeEach(async ({ page }) => {
    await mockSupabase(page);
    await forceLocaleES(page);
  });

  test('toggle favorito persiste en localStorage', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.wishlistToggle && window.wishlistToggle('VA-001'));
    const stored = await page.evaluate((k) => JSON.parse(localStorage.getItem(k) || '[]'), WISHLIST_KEY);
    expect(stored).toContain('VA-001');
    await page.evaluate(() => window.wishlistToggle('VA-001'));
    const empty = await page.evaluate((k) => JSON.parse(localStorage.getItem(k) || '[]'), WISHLIST_KEY);
    expect(empty).not.toContain('VA-001');
  });

  test('filtro "solo favoritos" muestra solo las piezas marcadas', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#grid > *').first()).toBeVisible({ timeout: 10_000 });
    // Marca VA-002 como favorito
    await page.evaluate(() => window.wishlistToggle('VA-002'));
    // El chip real espera un elemento DOM; lo clickeamos directamente. El panel
    // de filtros puede estar colapsado, así que forzamos el click.
    await page.locator('#filter-wishlist-chip').click({ force: true });
    // Ahora en el grid solo debe aparecer VA-002
    await expect(page.locator('#grid')).toContainText('VA-002');
    await expect(page.locator('#grid')).not.toContainText('VA-001');
  });
});

// @ts-check
const { test, expect } = require('@playwright/test');
const { mockSupabase } = require('./fixtures/productos');

test.describe('i18n ES ↔ EN', () => {
  test.beforeEach(async ({ page }) => {
    await mockSupabase(page);
  });

  test('cambiar a EN traduce el hero', async ({ page }) => {
    await page.goto('/');
    // Snapshot del texto original en ES
    const heroEs = await page.locator('.hero-sub').textContent();
    expect(heroEs).toMatch(/esmeraldas/i);
    // Toggle
    await page.evaluate(() => window.toggleLocale && window.toggleLocale());
    const heroEn = await page.locator('.hero-sub').textContent();
    expect(heroEn).not.toEqual(heroEs);
    // Persistencia
    const locale = await page.evaluate(() => localStorage.getItem('va_locale'));
    expect(locale).toBe('en');
  });

  test('el idioma persiste tras recargar', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.toggleLocale && window.toggleLocale());
    await page.reload();
    const html = await page.locator('html').getAttribute('lang');
    expect(html).toBe('en');
  });
});

test.describe('Wishlist (favoritos)', () => {
  test.beforeEach(async ({ page }) => {
    await mockSupabase(page);
  });

  test('toggle favorito persiste en localStorage', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.wishlistToggle && window.wishlistToggle('VA-001'));
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('va_wishlist') || '[]'));
    expect(stored).toContain('VA-001');
    // Segundo toggle lo quita
    await page.evaluate(() => window.wishlistToggle('VA-001'));
    const empty = await page.evaluate(() => JSON.parse(localStorage.getItem('va_wishlist') || '[]'));
    expect(empty).not.toContain('VA-001');
  });

  test('filtro "solo favoritos" muestra solo las piezas marcadas', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      window.wishlistToggle('VA-002');
      window.toggleWishlistFilter && window.toggleWishlistFilter(true);
    });
    // Ahora en el grid solo debe aparecer VA-002
    await expect(page.locator('#grid')).toContainText('VA-002');
    await expect(page.locator('#grid')).not.toContainText('VA-001');
  });
});

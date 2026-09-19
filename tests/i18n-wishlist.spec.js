// @ts-check
const { test, expect } = require('@playwright/test');
const { mockSupabase, forceLocaleES, waitForCatalog, LOCALE_KEY, WISHLIST_KEY } = require('./fixtures/productos');

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
    // NO usar forceLocaleES aquí: su addInitScript se dispara en cada
    // navegación (incluye reload), pisando la elección del toggle.
    // En su lugar sembramos 'en' una sola vez y verificamos que persiste.
    await page.addInitScript((key) => {
      try {
        if (!sessionStorage.getItem('__seeded__')) {
          localStorage.setItem(key, 'en');
          sessionStorage.setItem('__seeded__', '1');
        }
      } catch (_) {}
    }, LOCALE_KEY);
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
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
    await waitForCatalog(page);
    await expect(page.locator('#grid > *').first()).toBeVisible({ timeout: 10_000 });
    // Marca VA-002 como favorito y activa el filtro llamando al helper con el
    // elemento real (su firma es toggleWishlistFilter(btn) y hace btn.classList
    // .toggle). Click directo falla si el panel de filtros está colapsado.
    await page.evaluate(() => {
      window.wishlistToggle('VA-002');
      const btn = document.getElementById('filter-wishlist-chip');
      if (btn) window.toggleWishlistFilter(btn);
    });
    await expect(page.locator('#grid')).toContainText('VA-002');
    await expect(page.locator('#grid')).not.toContainText('VA-001');
  });
});

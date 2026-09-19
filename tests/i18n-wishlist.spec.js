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
});

// Este describe NO usa forceLocaleES para que el reload no reescriba el
// locale. Con la vitrina auto-detectando EN por navigator.language de
// Chromium, comprobamos que la persistencia via localStorage funcione.
test.describe('i18n persistencia sin init script', () => {
  test.beforeEach(async ({ page }) => {
    await mockSupabase(page);
  });

  test('el idioma persiste tras recargar', async ({ page }) => {
    await page.goto('/');
    // Chromium arranca en EN por auto-detect. Fijamos ES en localStorage
    // y verificamos que tras reload la vitrina sigue en ES.
    await page.evaluate((k) => localStorage.setItem(k, 'es'), LOCALE_KEY);
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
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
    await page.evaluate(() => {
      window.wishlistToggle('VA-002');
      const btn = document.getElementById('filter-wishlist-chip');
      if (btn) window.toggleWishlistFilter(btn);
    });
    // VA-002 es el arete (Chivor). VA-001 es el anillo (Muzo).
    await expect(page.locator('#grid')).toContainText(/chivor/i);
    await expect(page.locator('#grid')).not.toContainText(/muzo/i);
  });
});

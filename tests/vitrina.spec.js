// @ts-check
const { test, expect } = require('@playwright/test');
const { mockSupabase, forceLocaleES, PRODUCTOS } = require('./fixtures/productos');

test.describe('Vitrina — catálogo público', () => {
  test.beforeEach(async ({ page }) => {
    await mockSupabase(page);
    await forceLocaleES(page);
  });

  test('carga la home y renderiza el hero', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Verde Andino/i);
    await expect(page.locator('.hero-sub')).toBeVisible();
    await expect(page.locator('.skip-link')).toHaveAttribute('href', '#coleccion');
  });

  test('renderiza las tarjetas del catálogo mockeado', async ({ page }) => {
    await page.goto('/');
    const grid = page.locator('#grid');
    await expect(grid).toBeVisible();
    // Espera al primer render (el fetch mockeado tarda unos ms)
    await expect(grid.locator('> *').first()).toBeVisible({ timeout: 10_000 });
    await expect(grid.locator('> *')).toHaveCount(PRODUCTOS.length);
    await expect(grid).toContainText('VA-001');
  });

  test('el buscador filtra por texto', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#grid > *').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('#grid > *')).toHaveCount(PRODUCTOS.length);
    await page.locator('#search').fill('collar');
    await expect(page.locator('#grid')).toContainText('VA-003');
    await expect(page.locator('#grid')).not.toContainText('VA-001');
  });

  test('deep-link ?p=VA-001 abre el modal de esa pieza', async ({ page }) => {
    // Precarga el catálogo primero para que _sbCache esté lleno cuando llegue el deep-link
    await page.goto('/');
    await expect(page.locator('#grid > *').first()).toBeVisible({ timeout: 10_000 });
    await page.goto('/?p=VA-001');
    const modal = page.locator('.modal, .modal-overlay, [role="dialog"]').first();
    await expect(modal).toBeVisible({ timeout: 10_000 });
    await expect(modal).toContainText('VA-001');
    // Al cerrar, la URL vuelve a limpiarse (via _restaurarUrl)
    await page.keyboard.press('Escape');
    await expect.poll(() => new URL(page.url()).searchParams.get('p')).toBeNull();
  });

  test('los filtros por categoría (Anillo) reducen el grid', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#grid > *').first()).toBeVisible({ timeout: 10_000 });
    // Los pills viven en #pills y usan class="pill". El nombre viene del campo
    // `categoria` del producto sin traducir (nuestro mock: "anillo" en minúscula).
    const pill = page.locator('.pill', { hasText: /^anillo$/i }).first();
    await expect(pill).toBeVisible();
    await pill.click();
    await expect(page.locator('#grid')).toContainText('VA-001');
    await expect(page.locator('#grid')).not.toContainText('VA-003');
  });
});

// @ts-check
const { test, expect } = require('@playwright/test');
const { mockSupabase, forceLocaleES, waitForCatalog, PRODUCTOS } = require('./fixtures/productos');

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
    await waitForCatalog(page);
    const grid = page.locator('#grid');
    await expect(grid.locator('> *').first()).toBeVisible({ timeout: 10_000 });
    await expect(grid.locator('> *')).toHaveCount(PRODUCTOS.length);
    await expect(grid).toContainText('VA-001');
  });

  test('el buscador filtra por texto', async ({ page }) => {
    await page.goto('/');
    await waitForCatalog(page);
    await expect(page.locator('#grid > *')).toHaveCount(PRODUCTOS.length);
    await page.locator('#search').fill('collar');
    await expect(page.locator('#grid')).toContainText('VA-003');
    await expect(page.locator('#grid')).not.toContainText('VA-001');
  });

  test('deep-link ?p=VA-001 abre el modal de esa pieza', async ({ page }) => {
    await page.goto('/');
    await waitForCatalog(page);
    await page.goto('/?p=VA-001');
    await waitForCatalog(page);
    const modal = page.locator('.modal, .modal-overlay, [role="dialog"]').first();
    await expect(modal).toBeVisible({ timeout: 10_000 });
    await expect(modal).toContainText('VA-001');
    await page.keyboard.press('Escape');
    await expect.poll(() => new URL(page.url()).searchParams.get('p')).toBeNull();
  });

  test('los filtros por categoría (Anillo) reducen el grid', async ({ page }) => {
    await page.goto('/');
    await waitForCatalog(page);
    // renderPills escribe en #pills; navegamos ahí y clickeamos el pill de anillo
    const pill = page.locator('#pills .pill', { hasText: /^anillo$/i });
    await expect(pill).toBeVisible();
    await pill.scrollIntoViewIfNeeded();
    await pill.click();
    await expect(page.locator('#grid')).toContainText('VA-001');
    await expect(page.locator('#grid')).not.toContainText('VA-003');
  });
});

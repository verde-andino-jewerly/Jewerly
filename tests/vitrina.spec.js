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
    // Las tarjetas muestran descripcion + precio (no el id VA-xxx).
    // Cada mineral es único a una pieza.
    await expect(grid).toContainText(/muzo/i);     // VA-001
    await expect(grid).toContainText(/chivor/i);   // VA-002
    await expect(grid).toContainText(/coscuez/i);  // VA-003
  });

  test('el buscador filtra por texto', async ({ page }) => {
    await page.goto('/');
    await waitForCatalog(page);
    await expect(page.locator('#grid > *')).toHaveCount(PRODUCTOS.length);
    await page.locator('#search').fill('collar');
    await expect(page.locator('#grid')).toContainText(/coscuez/i);   // VA-003 (collar)
    await expect(page.locator('#grid')).not.toContainText(/muzo/i);  // VA-001 filtrado
  });

  test('deep-link ?p=VA-001 abre el modal de esa pieza', async ({ page }) => {
    await page.goto('/');
    await waitForCatalog(page);
    await page.goto('/?p=VA-001');
    await waitForCatalog(page);
    // El modal de producto es #modal (no confundir con #legal-modal, #cart-modal, etc.)
    const modal = page.locator('#modal');
    await expect(modal).toBeVisible({ timeout: 10_000 });
    await expect(modal).toContainText(/muzo/i);
    // Al cerrar, la URL vuelve a limpiarse (via _restaurarUrl)
    await page.keyboard.press('Escape');
    await expect.poll(() => new URL(page.url()).searchParams.get('p')).toBeNull();
  });

  test('los filtros por categoría (Anillo) reducen el grid', async ({ page }) => {
    await page.goto('/');
    await waitForCatalog(page);
    const pill = page.locator('#pills .pill', { hasText: /^anillo$/i });
    await expect(pill).toBeVisible();
    await pill.scrollIntoViewIfNeeded();
    await pill.click();
    // Solo debe quedar el anillo (VA-001, Muzo). Ni collar (Coscuez) ni arete (Chivor).
    await expect(page.locator('#grid')).toContainText(/muzo/i);
    await expect(page.locator('#grid')).not.toContainText(/coscuez/i);
    await expect(page.locator('#grid')).not.toContainText(/chivor/i);
  });
});

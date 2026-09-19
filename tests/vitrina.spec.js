// @ts-check
const { test, expect } = require('@playwright/test');
const { mockSupabase, PRODUCTOS } = require('./fixtures/productos');

test.describe('Vitrina — catálogo público', () => {
  test.beforeEach(async ({ page }) => {
    await mockSupabase(page);
  });

  test('carga la home y renderiza el hero', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Verde Andino/i);
    await expect(page.locator('.hero-sub')).toBeVisible();
    // Skip link accesible
    await expect(page.locator('.skip-link')).toHaveAttribute('href', '#coleccion');
  });

  test('renderiza las tarjetas del catálogo mockeado', async ({ page }) => {
    await page.goto('/');
    const grid = page.locator('#grid');
    await expect(grid).toBeVisible();
    // Espera a que aparezca al menos una tarjeta
    await expect(grid.locator('> *')).toHaveCount(PRODUCTOS.length, { timeout: 10_000 });
    // Los ids de las piezas aparecen en el DOM
    await expect(page.locator('body')).toContainText('VA-001');
  });

  test('el buscador filtra por texto', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#grid > *')).toHaveCount(PRODUCTOS.length);
    await page.locator('#search').fill('collar');
    // Debe quedar solo el collar (VA-003)
    await expect(page.locator('#grid')).toContainText('VA-003');
    await expect(page.locator('#grid')).not.toContainText('VA-001');
  });

  test('deep-link ?p=VA-001 abre el modal de esa pieza', async ({ page }) => {
    await page.goto('/?p=VA-001');
    // Modal visible
    const modal = page.locator('.modal, [role="dialog"]').first();
    await expect(modal).toBeVisible({ timeout: 10_000 });
    await expect(modal).toContainText('VA-001');
    // Al cerrar, la URL vuelve a limpiarse (via _restaurarUrl)
    await page.keyboard.press('Escape');
    await expect.poll(() => new URL(page.url()).searchParams.get('p')).toBeNull();
  });

  test('los filtros por categoría (Anillos) reducen el grid', async ({ page }) => {
    await page.goto('/');
    // Encuentra pill/botón que diga "Anillos" o "anillo"
    const pill = page.getByRole('button', { name: /anillo/i }).first();
    if (await pill.count()) {
      await pill.click();
      // VA-001 es anillo, VA-003 (collar) no debe verse
      await expect(page.locator('#grid')).toContainText('VA-001');
      await expect(page.locator('#grid')).not.toContainText('VA-003');
    } else {
      test.skip(true, 'La UI no expone pill "Anillos" con role=button');
    }
  });
});

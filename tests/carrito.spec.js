// @ts-check
const { test, expect } = require('@playwright/test');
const { mockSupabase, forceLocaleES, CART_KEY } = require('./fixtures/productos');

test.describe('Carrito v2 (con cantidades)', () => {
  test.beforeEach(async ({ page }) => {
    await mockSupabase(page);
    await forceLocaleES(page);
  });

  test('agregar una pieza al carrito actualiza el badge', async ({ page }) => {
    await page.goto('/');
    // Estado inicial: badge vacío o "0"
    const badge = page.locator('#cart-badge');
    const before = (await badge.textContent()) || '';
    expect(before.trim()).toBe('');

    // Llama al helper JS directo (independiente de dónde esté el botón "Agregar")
    await page.evaluate(() => window.carritoAgregar && window.carritoAgregar('VA-001'));
    await expect(badge).toHaveText(/1/);
  });

  test('incrementar la cantidad de la misma pieza suma unidades', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      window.carritoAgregar('VA-002');
      window.carritoAgregar('VA-002');
      window.carritoAgregar('VA-002');
    });
    await expect(page.locator('#cart-badge')).toHaveText(/3/);
  });

  test('quitar la pieza deja el badge vacío', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.carritoAgregar('VA-003'));
    await expect(page.locator('#cart-badge')).toHaveText(/1/);
    await page.evaluate(() => window.carritoQuitar && window.carritoQuitar('VA-003'));
    await expect(page.locator('#cart-badge')).toHaveText('');
  });

  test('formato v2 en localStorage: [{id, cantidad}]', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      window.carritoAgregar('VA-001');
      window.carritoAgregar('VA-001');
      window.carritoAgregar('VA-004');
    });
    const raw = await page.evaluate((k) => localStorage.getItem(k), CART_KEY);
    const parsed = JSON.parse(raw);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.every((x) => typeof x === 'object' && 'id' in x && 'cantidad' in x)).toBe(true);
    const total = parsed.reduce((n, x) => n + x.cantidad, 0);
    expect(total).toBe(3);
  });

  test('migración v1 → v2: [id, id, id] se rehidrata a v2', async ({ page }) => {
    await page.goto('/');
    // Inyecta formato viejo antes de leer
    await page.evaluate((k) => {
      localStorage.setItem(k, JSON.stringify(['VA-001', 'VA-001', 'VA-002']));
    }, CART_KEY);
    // carritoTotalUnidades usa carritoLeer, que aplica la migración al vuelo.
    const total = await page.evaluate(() => window.carritoTotalUnidades && window.carritoTotalUnidades());
    expect(total).toBe(3);
    // Cualquier operación que llame a carritoGuardar (agregar+quitar de un id
    // efímero) persiste el resto en el formato v2 sin cambiar el total real.
    await page.evaluate(() => {
      window.carritoAgregar('VA-tmp'); window.carritoQuitar('VA-tmp');
    });
    const raw = await page.evaluate((k) => localStorage.getItem(k), CART_KEY);
    const parsed = JSON.parse(raw);
    expect(parsed.some((x) => x.id === 'VA-001' && x.cantidad === 2)).toBe(true);
    expect(parsed.some((x) => x.id === 'VA-002' && x.cantidad === 1)).toBe(true);
  });
});

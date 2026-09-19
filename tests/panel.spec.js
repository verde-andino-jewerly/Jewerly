// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Panel administrativo (panel-deploy.html).
 *
 * Requiere el PIN real: pásalo por variable de entorno ADMIN_PIN.
 *
 *   ADMIN_PIN=1234 npx playwright test tests/panel.spec.js
 *
 * Si no hay PIN, el test se omite. Si defines MOCK_SUPABASE=1 se mockean
 * las respuestas de red del probe de autenticación (útil sin acceso al
 * proyecto Supabase).
 */

const PIN = process.env.ADMIN_PIN || '';
const MOCK = process.env.MOCK_SUPABASE === '1';

test.describe('Panel admin', () => {
  test.skip(!PIN, 'ADMIN_PIN no definido — export ADMIN_PIN=xxxx antes de correr');

  test.beforeEach(async ({ page }) => {
    if (MOCK) {
      // Devuelve una fila cualquiera al probe (basta con 200 + array)
      await page.route('**/rest/v1/productos**', (route) => route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 'VA-__auth_probe__' }]),
      }));
      await page.route('**/rest/v1/rpc/**', (route) => route.fulfill({
        status: 200, contentType: 'application/json', body: 'null',
      }));
    }
  });

  test('gate: PIN correcto oculta la caja y muestra la app', async ({ page }) => {
    await page.goto('/panel-deploy.html');
    await expect(page.locator('#auth-gate')).toBeVisible();

    await page.locator('#auth-pin').fill(PIN);
    await page.getByRole('button', { name: /entrar/i }).click();

    // Espera a que el gate desaparezca y la app se muestre
    await expect(page.locator('#auth-gate')).toBeHidden({ timeout: 10_000 });
    await expect(page.locator('#app')).toBeVisible();
    // Los tabs principales deben estar
    await expect(page.getByRole('button', { name: /calculadora/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /productos/i })).toBeVisible();
  });

  test('PIN incorrecto muestra el error y no expone la app', async ({ page }) => {
    await page.goto('/panel-deploy.html');
    await page.locator('#auth-pin').fill('000000-mal');
    await page.getByRole('button', { name: /entrar/i }).click();
    // El gate sigue visible
    await expect(page.locator('#auth-gate')).toBeVisible();
    // Y el mensaje de error aparece
    await expect(page.locator('#auth-error')).toBeVisible();
  });
});

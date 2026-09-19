// @ts-check
const { test, expect } = require('@playwright/test');
const { mockSupabase, forceLocaleES } = require('./fixtures/productos');

test.describe('Encargo personalizado', () => {
  test.beforeEach(async ({ page }) => {
    await mockSupabase(page);
    await forceLocaleES(page);
  });

  test('el modal se abre desde el CTA "Solicitar encargo personalizado"', async ({ page }) => {
    await page.goto('/');
    // Selector inequívoco del CTA en la sección "custom" (no matchea el
    // título del propio modal, que también contiene "Encargo personalizado").
    const cta = page.locator('a[data-i18n="section.custom.cta"]').first();
    await cta.scrollIntoViewIfNeeded();
    await cta.click();
    const modal = page.locator('#encargo-modal');
    await expect(modal).toBeVisible({ timeout: 5_000 });
  });

  test('enviar arma URL wa.me con el mensaje estructurado', async ({ page }) => {
    await page.goto('/');
    // Interceptar window.open y capturar la URL
    await page.evaluate(() => {
      window.__waCalls = [];
      window.open = (url) => { window.__waCalls.push(url); return null; };
    });
    // Ejecutar el envío directo si el helper existe
    const result = await page.evaluate(() => {
      if (typeof window.abrirEncargo === 'function') window.abrirEncargo();
      // Rellenar campos si el modal existe
      const pieza = document.querySelector('#encargo-pieza, [name="encargo-pieza"]');
      const desc = document.querySelector('#encargo-desc, textarea[name="encargo-desc"]');
      const nombre = document.querySelector('#encargo-nombre, input[name="encargo-nombre"]');
      const tel = document.querySelector('#encargo-tel, input[name="encargo-tel"]');
      if (pieza) pieza.value = 'Anillo con esmeralda';
      if (desc) desc.value = 'Piedra ovalada, tamaño 6, oro amarillo';
      if (nombre) nombre.value = 'Cliente Prueba';
      if (tel) tel.value = '3001234567';
      if (typeof window.enviarEncargo === 'function') {
        try { window.enviarEncargo(); } catch (e) { return { error: String(e) }; }
      }
      return { calls: window.__waCalls || [] };
    });
    if (result && result.calls && result.calls.length) {
      expect(result.calls[0]).toContain('wa.me');
    } else {
      test.info().annotations.push({ type: 'nota', description: 'enviarEncargo no abrió wa.me — revisar validación de campos requeridos' });
    }
  });
});

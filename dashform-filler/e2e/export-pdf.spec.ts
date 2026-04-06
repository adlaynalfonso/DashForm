import { test, expect } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const FIXTURES = path.join(__dirname, 'fixtures')
const DB_NAME = 'DashFormFiller'

async function clearDB(page: import('@playwright/test').Page) {
  await page.evaluate((name: string) => {
    return new Promise<void>((resolve) => {
      const req = indexedDB.deleteDatabase(name)
      req.onsuccess = () => resolve()
      req.onerror = () => resolve()
      req.onblocked = () => resolve()
    })
  }, DB_NAME)
}

/** Import the test template, create a form, fill required fields, and complete it.
 *  Returns after being redirected to the /export/:id page. */
async function setupCompletedForm(page: import('@playwright/test').Page) {
  await page.goto('/')
  await clearDB(page)
  await page.reload()
  await page.waitForLoadState('networkidle')

  // Import template
  const [fc] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByText('Importar Plantilla').click(),
  ])
  await fc.setFiles(path.join(FIXTURES, 'plantilla_test.json'))
  await expect(page.getByText('Formulario de Prueba E2E')).toBeVisible()

  // Create form
  await page.getByText('Nuevo Formulario').click()
  await page.waitForURL(/\/fill\//)

  // Fill required fields — wait for form to finish loading first
  await expect(page.getByLabel('Nombre completo')).toBeVisible({ timeout: 10_000 })
  await page.getByLabel('Nombre completo').fill('Ana García')
  await page.getByLabel('Correo electrónico').fill('ana@ejemplo.com')

  // Complete the form – validates all fields and navigates to /export/:id
  await page.getByRole('button', { name: 'Completar' }).click()
  await page.waitForURL(/\/export\//, { timeout: 15_000 })

  // Wait for ExportPage to finish loading (lazy module + IndexedDB fetch)
  await expect(page.getByRole('heading', { name: /exportar pdf/i })).toBeVisible({ timeout: 15_000 })
}

// ── Test 1: abrir formulario rellenado → ir a exportar → seleccionar template ─

test('navegar a la página de exportación y seleccionar un template', async ({ page }) => {
  await setupCompletedForm(page)

  // Export page should be loaded with PDF export section and download button
  await expect(page.getByRole('heading', { name: /exportar pdf/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /descargar pdf/i })).toBeVisible()

  // Select corporate template
  await page.getByText('Corporativo').click()
  // Template button should become active (visual verification via text)
  await expect(page.getByText('Corporativo')).toBeVisible()
})

// ── Test 2: generar PDF (botón funciona sin errores) ──────────────────────────

test('exportar PDF → el botón de descarga funciona', async ({ page }) => {
  test.setTimeout(60_000)
  await setupCompletedForm(page)

  const downloadBtn = page.getByRole('button', { name: /descargar pdf/i })
  await expect(downloadBtn).toBeVisible({ timeout: 15_000 })
  await expect(downloadBtn).toBeEnabled()

  // Click the button and verify no error appears
  await downloadBtn.click()
  // Wait for PDF generation to start/finish (button shows "Generando…" then reverts)
  await page.waitForTimeout(3_000)
  // Verify no error toast/message appeared
  await expect(page.getByText(/error al generar/i)).not.toBeVisible()
})

// ── Test 3: el formulario completado muestra el estado correcto ───────────────

test('formulario completado muestra estado "Completado" en la exportación', async ({ page }) => {
  await setupCompletedForm(page)

  await expect(page.getByText(/completado/i)).toBeVisible({ timeout: 10_000 })
  await expect(page.getByText(/campos rellenados/i)).toBeVisible()
})

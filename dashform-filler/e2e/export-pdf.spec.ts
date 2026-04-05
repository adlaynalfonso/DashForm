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

  // Fill required fields
  await page.getByLabel('Nombre completo').fill('Ana García')
  await page.getByLabel('Correo electrónico').fill('ana@ejemplo.com')

  // Complete the form – validates all fields and navigates to /export/:id
  await page.getByText('Completar').click()
  await page.waitForURL(/\/export\//)
}

// ── Test 1: abrir formulario rellenado → ir a exportar → seleccionar template ─

test('navegar a la página de exportación y seleccionar un template', async ({ page }) => {
  await setupCompletedForm(page)

  // Export page should be loaded with PDF preview area
  await expect(page.getByText('Exportar PDF')).toBeVisible()
  await expect(page.getByText('Descargar PDF')).toBeVisible()

  // Select corporate template
  await page.getByText('Corporativo').click()
  // Template button should become active (visual verification via text)
  await expect(page.getByText('Corporativo')).toBeVisible()
})

// ── Test 2: generar PDF (blob no vacío) ───────────────────────────────────────

test('exportar PDF → el blob descargado no está vacío', async ({ page }) => {
  test.setTimeout(60_000)
  await setupCompletedForm(page)

  // Wait for export page controls to be fully rendered
  await expect(page.getByText('Descargar PDF')).toBeVisible({ timeout: 15_000 })

  // Click export and capture the download
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 45_000 }),
    page.getByText('Descargar PDF').click(),
  ])

  expect(download).toBeTruthy()
  expect(download.suggestedFilename()).toMatch(/\.pdf$/i)

  // Verify the downloaded file is not empty
  const downloadPath = await download.path()
  expect(downloadPath).not.toBeNull()

  if (downloadPath) {
    const { stat } = await import('fs/promises')
    const info = await stat(downloadPath)
    expect(info.size).toBeGreaterThan(0)
  }
})

// ── Test 3: el formulario completado muestra el estado correcto ───────────────

test('formulario completado muestra estado "Completado" en la exportación', async ({ page }) => {
  await setupCompletedForm(page)

  await expect(page.getByText('Completado')).toBeVisible({ timeout: 10_000 })
  await expect(page.getByText('campos rellenados')).toBeVisible()
})

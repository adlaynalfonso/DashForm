import { test, expect } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const FIXTURES = path.join(__dirname, 'fixtures')
const DB_NAME = 'DashFormFiller'

// Clear IndexedDB before each test so state is always fresh.
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

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await clearDB(page)
  await page.reload()
  await page.waitForLoadState('networkidle')
})

// ── Test 1: importar plantilla → verificar en biblioteca ──────────────────────

test('importar plantilla JSON → aparece en biblioteca', async ({ page }) => {
  const [fileChooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByText('Importar Plantilla').click(),
  ])
  await fileChooser.setFiles(path.join(FIXTURES, 'plantilla_test.json'))

  await expect(page.getByText('Formulario de Prueba E2E')).toBeVisible()
})

// ── Test 2: importar → crear formulario → rellenar → autoguardado ─────────────

test('crear formulario → rellenar campos → verificar autoguardado', async ({ page }) => {
  // Import template
  const [fc1] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByText('Importar Plantilla').click(),
  ])
  await fc1.setFiles(path.join(FIXTURES, 'plantilla_test.json'))
  await expect(page.getByText('Formulario de Prueba E2E')).toBeVisible()

  // Create form
  await page.getByText('Nuevo Formulario').click()
  await page.waitForURL(/\/fill\//)

  // Fill fields
  await page.getByLabel('Nombre completo').fill('Ana García')
  await page.getByLabel('Correo electrónico').fill('ana@ejemplo.com')

  // Autosave triggers after debounce – wait for "Guardado" indicator
  await expect(page.getByText('Guardado')).toBeVisible({ timeout: 10_000 })
})

// ── Test 3: exportar editable → importar en nueva página → verificar datos ────

test('exportar editable → importar editable → verificar datos cargados', async ({ page }) => {
  // Import template and create form first
  const [fc1] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByText('Importar Plantilla').click(),
  ])
  await fc1.setFiles(path.join(FIXTURES, 'plantilla_test.json'))
  await expect(page.getByText('Formulario de Prueba E2E')).toBeVisible()

  await page.getByText('Nuevo Formulario').click()
  await page.waitForURL(/\/fill\//)

  // Fill fields
  await page.getByLabel('Nombre completo').fill('Ana García')
  await page.getByLabel('Correo electrónico').fill('ana@ejemplo.com')

  // Export editable (Share2 button with title)
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByTitle('Exportar formulario editable (.json)').click(),
  ])
  expect(download.suggestedFilename()).toMatch(/\.json$/)

  // Go back home and import the fixture editable (same data as what we filled)
  await page.goto('/')
  await page.waitForLoadState('networkidle')

  const [fc2] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByTitle('Importar formulario en progreso (.json)').click(),
  ])
  await fc2.setFiles(path.join(FIXTURES, 'editable_test.json'))

  // Should navigate to fill page with pre-loaded data
  await page.waitForURL(/\/fill\//)
  await expect(page.getByDisplayValue('Ana García')).toBeVisible({ timeout: 8_000 })
  await expect(page.getByDisplayValue('ana@ejemplo.com')).toBeVisible()
})

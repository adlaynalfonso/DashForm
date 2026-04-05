# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: export-pdf.spec.ts >> formulario completado muestra estado "Completado" en la exportación
- Location: e2e/export-pdf.spec.ts:95:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Completado')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByText('Completado')

```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test'
  2   | import path from 'path'
  3   | import { fileURLToPath } from 'url'
  4   | 
  5   | const __dirname = path.dirname(fileURLToPath(import.meta.url))
  6   | const FIXTURES = path.join(__dirname, 'fixtures')
  7   | const DB_NAME = 'DashFormFiller'
  8   | 
  9   | async function clearDB(page: import('@playwright/test').Page) {
  10  |   await page.evaluate((name: string) => {
  11  |     return new Promise<void>((resolve) => {
  12  |       const req = indexedDB.deleteDatabase(name)
  13  |       req.onsuccess = () => resolve()
  14  |       req.onerror = () => resolve()
  15  |       req.onblocked = () => resolve()
  16  |     })
  17  |   }, DB_NAME)
  18  | }
  19  | 
  20  | /** Import the test template, create a form, fill required fields, and complete it.
  21  |  *  Returns after being redirected to the /export/:id page. */
  22  | async function setupCompletedForm(page: import('@playwright/test').Page) {
  23  |   await page.goto('/')
  24  |   await clearDB(page)
  25  |   await page.reload()
  26  |   await page.waitForLoadState('networkidle')
  27  | 
  28  |   // Import template
  29  |   const [fc] = await Promise.all([
  30  |     page.waitForEvent('filechooser'),
  31  |     page.getByText('Importar Plantilla').click(),
  32  |   ])
  33  |   await fc.setFiles(path.join(FIXTURES, 'plantilla_test.json'))
  34  |   await expect(page.getByText('Formulario de Prueba E2E')).toBeVisible()
  35  | 
  36  |   // Create form
  37  |   await page.getByText('Nuevo Formulario').click()
  38  |   await page.waitForURL(/\/fill\//)
  39  | 
  40  |   // Fill required fields
  41  |   await page.getByLabel('Nombre completo').fill('Ana García')
  42  |   await page.getByLabel('Correo electrónico').fill('ana@ejemplo.com')
  43  | 
  44  |   // Complete the form – validates all fields and navigates to /export/:id
  45  |   await page.getByText('Completar').click()
  46  |   await page.waitForURL(/\/export\//)
  47  | }
  48  | 
  49  | // ── Test 1: abrir formulario rellenado → ir a exportar → seleccionar template ─
  50  | 
  51  | test('navegar a la página de exportación y seleccionar un template', async ({ page }) => {
  52  |   await setupCompletedForm(page)
  53  | 
  54  |   // Export page should be loaded with PDF preview area
  55  |   await expect(page.getByText('Exportar PDF')).toBeVisible()
  56  |   await expect(page.getByText('Descargar PDF')).toBeVisible()
  57  | 
  58  |   // Select corporate template
  59  |   await page.getByText('Corporativo').click()
  60  |   // Template button should become active (visual verification via text)
  61  |   await expect(page.getByText('Corporativo')).toBeVisible()
  62  | })
  63  | 
  64  | // ── Test 2: generar PDF (blob no vacío) ───────────────────────────────────────
  65  | 
  66  | test('exportar PDF → el blob descargado no está vacío', async ({ page }) => {
  67  |   test.setTimeout(60_000)
  68  |   await setupCompletedForm(page)
  69  | 
  70  |   // Wait for export page controls to be fully rendered
  71  |   await expect(page.getByText('Descargar PDF')).toBeVisible({ timeout: 15_000 })
  72  | 
  73  |   // Click export and capture the download
  74  |   const [download] = await Promise.all([
  75  |     page.waitForEvent('download', { timeout: 45_000 }),
  76  |     page.getByText('Descargar PDF').click(),
  77  |   ])
  78  | 
  79  |   expect(download).toBeTruthy()
  80  |   expect(download.suggestedFilename()).toMatch(/\.pdf$/i)
  81  | 
  82  |   // Verify the downloaded file is not empty
  83  |   const downloadPath = await download.path()
  84  |   expect(downloadPath).not.toBeNull()
  85  | 
  86  |   if (downloadPath) {
  87  |     const { stat } = await import('fs/promises')
  88  |     const info = await stat(downloadPath)
  89  |     expect(info.size).toBeGreaterThan(0)
  90  |   }
  91  | })
  92  | 
  93  | // ── Test 3: el formulario completado muestra el estado correcto ───────────────
  94  | 
  95  | test('formulario completado muestra estado "Completado" en la exportación', async ({ page }) => {
  96  |   await setupCompletedForm(page)
  97  | 
> 98  |   await expect(page.getByText('Completado')).toBeVisible({ timeout: 10_000 })
      |                                              ^ Error: expect(locator).toBeVisible() failed
  99  |   await expect(page.getByText('campos rellenados')).toBeVisible()
  100 | })
  101 | 
```
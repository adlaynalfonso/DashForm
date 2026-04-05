# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: import-and-fill.spec.ts >> exportar editable → importar editable → verificar datos cargados
- Location: e2e/import-and-fill.spec.ts:65:1

# Error details

```
TypeError: page.getByDisplayValue is not a function
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e6]:
        - img [ref=e8]
        - generic [ref=e11]: DashForm Filler
      - button "Importar Editable" [ref=e12] [cursor=pointer]:
        - img [ref=e13]
        - generic [ref=e16]: Importar Editable
    - generic [ref=e17]:
      - button "Plantillas 1" [ref=e18] [cursor=pointer]:
        - img [ref=e19]
        - text: Plantillas
        - generic [ref=e21]: "1"
      - button "En Curso 1" [ref=e22] [cursor=pointer]:
        - img [ref=e23]
        - text: En Curso
        - generic [ref=e26]: "1"
      - button "Historial" [ref=e27] [cursor=pointer]:
        - img [ref=e28]
        - text: Historial
  - main [ref=e31]:
    - generic [ref=e32]:
      - generic [ref=e33]:
        - heading "Biblioteca" [level=2] [ref=e34]
        - button "Importar Plantilla" [ref=e35] [cursor=pointer]:
          - img [ref=e36]
          - text: Importar Plantilla
      - generic [ref=e40]:
        - generic [ref=e41]:
          - img [ref=e43]
          - generic [ref=e46]:
            - paragraph [ref=e47]: Formulario de Prueba E2E
            - paragraph [ref=e48]: Plantilla para tests E2E automatizados
        - generic [ref=e49]:
          - generic [ref=e50]: 2 campos
          - generic [ref=e51]: ·
          - generic [ref=e52]: Importado 05 abr 2026
        - generic [ref=e53]:
          - button "Nuevo Formulario" [ref=e54] [cursor=pointer]:
            - img [ref=e55]
            - text: Nuevo Formulario
          - button "Eliminar de biblioteca" [ref=e56] [cursor=pointer]:
            - img [ref=e57]
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
  9   | // Clear IndexedDB before each test so state is always fresh.
  10  | async function clearDB(page: import('@playwright/test').Page) {
  11  |   await page.evaluate((name: string) => {
  12  |     return new Promise<void>((resolve) => {
  13  |       const req = indexedDB.deleteDatabase(name)
  14  |       req.onsuccess = () => resolve()
  15  |       req.onerror = () => resolve()
  16  |       req.onblocked = () => resolve()
  17  |     })
  18  |   }, DB_NAME)
  19  | }
  20  | 
  21  | test.beforeEach(async ({ page }) => {
  22  |   await page.goto('/')
  23  |   await clearDB(page)
  24  |   await page.reload()
  25  |   await page.waitForLoadState('networkidle')
  26  | })
  27  | 
  28  | // ── Test 1: importar plantilla → verificar en biblioteca ──────────────────────
  29  | 
  30  | test('importar plantilla JSON → aparece en biblioteca', async ({ page }) => {
  31  |   const [fileChooser] = await Promise.all([
  32  |     page.waitForEvent('filechooser'),
  33  |     page.getByText('Importar Plantilla').click(),
  34  |   ])
  35  |   await fileChooser.setFiles(path.join(FIXTURES, 'plantilla_test.json'))
  36  | 
  37  |   await expect(page.getByText('Formulario de Prueba E2E')).toBeVisible()
  38  | })
  39  | 
  40  | // ── Test 2: importar → crear formulario → rellenar → autoguardado ─────────────
  41  | 
  42  | test('crear formulario → rellenar campos → verificar autoguardado', async ({ page }) => {
  43  |   // Import template
  44  |   const [fc1] = await Promise.all([
  45  |     page.waitForEvent('filechooser'),
  46  |     page.getByText('Importar Plantilla').click(),
  47  |   ])
  48  |   await fc1.setFiles(path.join(FIXTURES, 'plantilla_test.json'))
  49  |   await expect(page.getByText('Formulario de Prueba E2E')).toBeVisible()
  50  | 
  51  |   // Create form
  52  |   await page.getByText('Nuevo Formulario').click()
  53  |   await page.waitForURL(/\/fill\//)
  54  | 
  55  |   // Fill fields
  56  |   await page.getByLabel('Nombre completo').fill('Ana García')
  57  |   await page.getByLabel('Correo electrónico').fill('ana@ejemplo.com')
  58  | 
  59  |   // Autosave triggers after debounce – wait for "Guardado" indicator
  60  |   await expect(page.getByText('Guardado')).toBeVisible({ timeout: 10_000 })
  61  | })
  62  | 
  63  | // ── Test 3: exportar editable → importar en nueva página → verificar datos ────
  64  | 
  65  | test('exportar editable → importar editable → verificar datos cargados', async ({ page }) => {
  66  |   // Import template and create form first
  67  |   const [fc1] = await Promise.all([
  68  |     page.waitForEvent('filechooser'),
  69  |     page.getByText('Importar Plantilla').click(),
  70  |   ])
  71  |   await fc1.setFiles(path.join(FIXTURES, 'plantilla_test.json'))
  72  |   await expect(page.getByText('Formulario de Prueba E2E')).toBeVisible()
  73  | 
  74  |   await page.getByText('Nuevo Formulario').click()
  75  |   await page.waitForURL(/\/fill\//)
  76  | 
  77  |   // Fill fields
  78  |   await page.getByLabel('Nombre completo').fill('Ana García')
  79  |   await page.getByLabel('Correo electrónico').fill('ana@ejemplo.com')
  80  | 
  81  |   // Export editable (Share2 button with title)
  82  |   const [download] = await Promise.all([
  83  |     page.waitForEvent('download'),
  84  |     page.getByTitle('Exportar formulario editable (.json)').click(),
  85  |   ])
  86  |   expect(download.suggestedFilename()).toMatch(/\.json$/)
  87  | 
  88  |   // Go back home and import the fixture editable (same data as what we filled)
  89  |   await page.goto('/')
  90  |   await page.waitForLoadState('networkidle')
  91  | 
  92  |   const [fc2] = await Promise.all([
  93  |     page.waitForEvent('filechooser'),
  94  |     page.getByTitle('Importar formulario en progreso (.json)').click(),
  95  |   ])
  96  |   await fc2.setFiles(path.join(FIXTURES, 'editable_test.json'))
  97  | 
  98  |   // Should navigate to fill page with pre-loaded data
  99  |   await page.waitForURL(/\/fill\//)
> 100 |   await expect(page.getByDisplayValue('Ana García')).toBeVisible({ timeout: 8_000 })
      |                     ^ TypeError: page.getByDisplayValue is not a function
  101 |   await expect(page.getByDisplayValue('ana@ejemplo.com')).toBeVisible()
  102 | })
  103 | 
```
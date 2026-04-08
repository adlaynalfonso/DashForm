import { test, expect } from '@playwright/test'
import path from 'path'
import fs from 'fs'

/**
 * Full creator flow:
 * HomePage → create template → add section → add fields → configure field
 * → save → appear in list → export JSON → verify file structure
 */

test.describe('DashForm Creator — full flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Clear IndexedDB so each test starts fresh
    await page.evaluate(() => indexedDB.deleteDatabase('DashFormCreator'))
    await page.reload()
    await page.waitForLoadState('networkidle')
  })

  // ── 1. Home page renders ──────────────────────────────────────────────────

  test('home page shows title and new-template button', async ({ page }) => {
    await expect(page.getByText('DashForm Creator')).toBeVisible()
    await expect(page.getByRole('button', { name: /nueva plantilla/i })).toBeVisible()
  })

  test('empty state shows invite to create first template', async ({ page }) => {
    await expect(page.getByText(/primera plantilla/i)).toBeVisible()
  })

  // ── 2. Navigate to editor ─────────────────────────────────────────────────

  test('clicking "Nueva Plantilla" navigates to /editor', async ({ page }) => {
    await page.getByRole('button', { name: /nueva plantilla/i }).click()
    await expect(page).toHaveURL(/\/editor/)
  })

  // ── 3. Create a template with section and fields ──────────────────────────

  test('can set template name in editor', async ({ page }) => {
    await page.goto('/editor')
    const nameInput = page.getByPlaceholder('Nombre de la plantilla')
    await nameInput.fill('Formulario de Prueba')
    await expect(nameInput).toHaveValue('Formulario de Prueba')
  })

  test('can add a section', async ({ page }) => {
    await page.goto('/editor')
    // Click the Sección button
    await page.getByRole('button', { name: /añadir sección|sección/i }).first().click()
    // A section tab should appear
    await expect(page.getByText('Nueva Sección')).toBeVisible()
  })

  test('can add a text field to a section', async ({ page }) => {
    await page.goto('/editor')
    await page.getByRole('button', { name: /sección/i }).first().click()
    // Open field type dropdown
    await page.getByRole('button', { name: /añadir campo/i }).click()
    // Pick "Texto"
    await page.getByRole('button', { name: /^Texto$/ }).click()
    // Field should appear in the list
    await expect(page.getByText('Campo de texto')).toBeVisible()
  })

  test('clicking a field opens the configurator panel', async ({ page }) => {
    await page.goto('/editor')
    await page.getByRole('button', { name: /sección/i }).first().click()
    await page.getByRole('button', { name: /añadir campo/i }).click()
    await page.getByRole('button', { name: /^Texto$/ }).click()

    // Click the field card (not the buttons inside it)
    await page.getByText('Campo de texto').click()

    // Panel should slide in with a "Cerrar" button
    await expect(page.getByRole('button', { name: /cerrar/i })).toBeVisible()
    // Label input should be visible
    await expect(page.getByPlaceholder(/nombre completo|texto/i).or(
      page.getByLabel(/etiqueta/i)
    )).toBeVisible()
  })

  test('configurator label change is reflected in the field list', async ({ page }) => {
    await page.goto('/editor')
    await page.getByRole('button', { name: /sección/i }).first().click()
    await page.getByRole('button', { name: /añadir campo/i }).click()
    await page.getByRole('button', { name: /^Texto$/ }).click()
    await page.getByText('Campo de texto').click()

    // Find the label input inside the panel and change it
    const labelInput = page.getByLabel(/etiqueta/i)
    await labelInput.fill('Nombre Completo')

    // Close panel
    await page.getByRole('button', { name: /cerrar/i }).click()

    // Field list should show new label
    await expect(page.getByText('Nombre Completo')).toBeVisible()
  })

  // ── 4. Save and appear in list ────────────────────────────────────────────

  test('saving a template navigates to /editor/:id', async ({ page }) => {
    await page.goto('/editor')
    await page.getByPlaceholder('Nombre de la plantilla').fill('Test Save')
    await page.getByRole('button', { name: /sección/i }).first().click()
    await page.getByRole('button', { name: /añadir campo/i }).click()
    await page.getByRole('button', { name: /^Texto$/ }).click()

    await page.getByRole('button', { name: /^Guardar$/ }).click()

    // URL should now have an id segment
    await expect(page).toHaveURL(/\/editor\/.+/)
    // "Guardado" toast should appear briefly
    await expect(page.getByText('Guardado')).toBeVisible()
  })

  test('saved template appears on home page', async ({ page }) => {
    await page.goto('/editor')
    await page.getByPlaceholder('Nombre de la plantilla').fill('Mi Plantilla Lista')
    await page.getByRole('button', { name: /sección/i }).first().click()
    await page.getByRole('button', { name: /añadir campo/i }).click()
    await page.getByRole('button', { name: /^Texto$/ }).click()
    await page.getByRole('button', { name: /^Guardar$/ }).click()
    await page.getByText('Guardado').waitFor({ state: 'visible' })

    await page.goto('/')
    await expect(page.getByText('Mi Plantilla Lista')).toBeVisible()
  })

  // ── 5. Export JSON and verify structure ───────────────────────────────────

  test('exported JSON has correct structure', async ({ page }) => {
    // Create and save a template first
    await page.goto('/editor')
    await page.getByPlaceholder('Nombre de la plantilla').fill('Export Test')
    await page.getByRole('button', { name: /sección/i }).first().click()
    await page.getByRole('button', { name: /añadir campo/i }).click()
    await page.getByRole('button', { name: /^Texto$/ }).click()
    await page.getByRole('button', { name: /^Guardar$/ }).click()
    await page.getByText('Guardado').waitFor({ state: 'visible' })

    // Go home and export
    await page.goto('/')
    await page.getByText('Export Test').waitFor()

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /exportar/i }).first().click(),
    ])

    // If validation modal appears (e.g. on first export), confirm
    const confirmBtn = page.getByRole('button', { name: /exportar igualmente/i })
    if (await confirmBtn.isVisible().catch(() => false)) {
      await confirmBtn.click()
      // wait for the actual download after confirmation
    }

    const filePath = await download.path()
    expect(filePath).toBeTruthy()

    const raw = fs.readFileSync(filePath!, 'utf-8')
    const json = JSON.parse(raw)

    // Structure assertions
    expect(json.type).toBe('dashform-template')
    expect(json.schemaVersion).toBe(1)
    expect(typeof json.exportedAt).toBe('string')
    expect(json.template).toBeDefined()
    expect(json.template.nombre).toBe('Export Test')
    expect(Array.isArray(json.template.secciones)).toBe(true)
    expect(json.template.secciones[0].campos).toHaveLength(1)
    expect(json.template.secciones[0].campos[0].tipo).toBe('texto')
  })

  // ── 6. PDF config tab ────────────────────────────────────────────────────

  test('Diseño PDF tab is visible in editor', async ({ page }) => {
    await page.goto('/editor')
    await expect(page.getByRole('button', { name: /diseño pdf/i })).toBeVisible()
  })

  test('switching to Diseño PDF tab shows template selector', async ({ page }) => {
    await page.goto('/editor')
    await page.getByRole('button', { name: /diseño pdf/i }).click()
    await expect(page.getByText(/Moderno Minimalista/i)).toBeVisible()
    await expect(page.getByText(/Corporativo/i)).toBeVisible()
    await expect(page.getByText(/Compacto/i)).toBeVisible()
  })

  // ── 7. Delete template ────────────────────────────────────────────────────

  test('delete button opens confirmation modal', async ({ page }) => {
    // Create a template first
    await page.goto('/editor')
    await page.getByPlaceholder('Nombre de la plantilla').fill('Para Borrar')
    await page.getByRole('button', { name: /sección/i }).first().click()
    await page.getByRole('button', { name: /añadir campo/i }).click()
    await page.getByRole('button', { name: /^Texto$/ }).click()
    await page.getByRole('button', { name: /^Guardar$/ }).click()
    await page.getByText('Guardado').waitFor()

    await page.goto('/')
    await page.getByRole('button', { name: /eliminar/i }).first().click()
    await expect(page.getByText(/esta acción no se puede deshacer/i)).toBeVisible()
  })

  test('confirming delete removes template from list', async ({ page }) => {
    await page.goto('/editor')
    await page.getByPlaceholder('Nombre de la plantilla').fill('Borrame')
    await page.getByRole('button', { name: /sección/i }).first().click()
    await page.getByRole('button', { name: /añadir campo/i }).click()
    await page.getByRole('button', { name: /^Texto$/ }).click()
    await page.getByRole('button', { name: /^Guardar$/ }).click()
    await page.getByText('Guardado').waitFor()

    await page.goto('/')
    await page.getByRole('button', { name: /eliminar/i }).first().click()
    await page.getByRole('button', { name: /^Eliminar$/ }).click()

    await expect(page.getByText('Borrame')).not.toBeVisible()
  })

  // ── 8. Import JSON template ───────────────────────────────────────────────

  test('importing a valid JSON template navigates to editor', async ({ page }) => {
    // Build a minimal valid dashform-template JSON file
    const template = {
      type: 'dashform-template',
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      template: {
        id: 'import-original-id',
        nombre: 'Plantilla Importada',
        descripcion: 'Importada desde archivo',
        version: '1.0.0',
        schemaVersion: 1,
        pdfConfig: { template: 'modern', colorTema: '#3b82f6' },
        secciones: [
          {
            id: 's1',
            nombre: 'Sección 1',
            campos: [
              { id: 'f1', tipo: 'texto', label: 'Nombre', obligatorio: false },
            ],
          },
        ],
      },
    }

    const filePath = path.join(__dirname, '__fixtures__', 'import-test.json')
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    fs.writeFileSync(filePath, JSON.stringify(template))

    try {
      await page.goto('/')

      // Trigger file chooser via the Importar button
      const [fileChooser] = await Promise.all([
        page.waitForEvent('filechooser'),
        page.getByRole('button', { name: /importar/i }).click(),
      ])
      await fileChooser.setFiles(filePath)

      // Should navigate to /editor/:id (with a NEW id, not 'import-original-id')
      await expect(page).toHaveURL(/\/editor\/.+/, { timeout: 5000 })
      await expect(page).not.toHaveURL(/import-original-id/)

      // Template name should be pre-filled
      await expect(page.getByPlaceholder('Nombre de la plantilla')).toHaveValue('Plantilla Importada')
    } finally {
      fs.rmSync(filePath, { force: true })
    }
  })

  test('importing an invalid file shows an error banner', async ({ page }) => {
    const filePath = path.join(__dirname, '__fixtures__', 'invalid.json')
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    fs.writeFileSync(filePath, JSON.stringify({ type: 'dashform-editable' }))

    try {
      await page.goto('/')

      const [fileChooser] = await Promise.all([
        page.waitForEvent('filechooser'),
        page.getByRole('button', { name: /importar/i }).click(),
      ])
      await fileChooser.setFiles(filePath)

      // Should stay on home page
      await expect(page).toHaveURL('/')
      // Error banner with Filler mention should appear
      await expect(page.getByText(/filler/i)).toBeVisible({ timeout: 3000 })
    } finally {
      fs.rmSync(filePath, { force: true })
    }
  })
})

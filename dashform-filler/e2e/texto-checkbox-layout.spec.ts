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

test('texto-checkbox renders checkbox, label, and input on the same line', async ({ page }) => {
  await page.goto('/')
  await clearDB(page)
  await page.reload()
  await page.waitForLoadState('networkidle')

  // Import template with texto-checkbox field
  const [fileChooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByText('Importar Plantilla').click(),
  ])
  await fileChooser.setFiles(path.join(FIXTURES, 'plantilla_texto_checkbox.json'))
  await expect(page.getByText('Test Texto-Checkbox')).toBeVisible()

  // Create form
  await page.getByText('Nuevo Formulario').click()
  await page.waitForURL(/\/fill\//)

  // Take screenshot for visual verification
  await page.screenshot({ path: 'test-results/texto-checkbox-layout.png', fullPage: true })

  // Get the checkbox and the label — they should be on the same vertical position (same Y)
  const checkbox = page.locator('input[type="checkbox"]')
  const label = page.locator('label[for="tc1-check"]')
  const textInput = page.locator('input[type="text"]#tc1')

  await expect(checkbox).toBeVisible()
  await expect(label).toBeVisible()
  await expect(textInput).toBeVisible()

  // Verify they share the same vertical position (same line)
  const cbBox = await checkbox.boundingBox()
  const labelBox = await label.boundingBox()
  const inputBox = await textInput.boundingBox()

  expect(cbBox).not.toBeNull()
  expect(labelBox).not.toBeNull()
  expect(inputBox).not.toBeNull()

  // All three elements should overlap vertically (same row)
  // The center Y of each element should be within 10px of each other
  const cbCenterY = cbBox!.y + cbBox!.height / 2
  const labelCenterY = labelBox!.y + labelBox!.height / 2
  const inputCenterY = inputBox!.y + inputBox!.height / 2

  expect(Math.abs(cbCenterY - labelCenterY)).toBeLessThan(15)
  expect(Math.abs(labelCenterY - inputCenterY)).toBeLessThan(15)

  // Verify horizontal order: checkbox.x < label.x < input.x
  expect(cbBox!.x).toBeLessThan(labelBox!.x)
  expect(labelBox!.x).toBeLessThan(inputBox!.x)
})

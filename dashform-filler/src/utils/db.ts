import { openDB, type IDBPDatabase } from 'idb'
import type { Template } from '@/types/template'
import type { FilledForm } from '@/types/filledForm'

const DB_NAME = 'DashFormFiller'
const DB_VERSION = 1

interface FillerDB {
  plantillas: {
    key: string
    value: Template & { fechaImportacion: string }
    indexes: {
      nombre: string
      fechaImportacion: string
    }
  }
  formulariosRellenados: {
    key: string
    value: FilledForm
    indexes: {
      templateId: string
      estado: FilledForm['estado']
      fechaModificacion: string
    }
  }
  configuracion: {
    key: string
    value: { clave: string; valor: unknown }
  }
}

type FillerDBInstance = IDBPDatabase<FillerDB>

let dbInstance: FillerDBInstance | null = null

export async function initFillerDB(): Promise<FillerDBInstance> {
  if (dbInstance) return dbInstance

  dbInstance = await openDB<FillerDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      const plantillas = db.createObjectStore('plantillas', { keyPath: 'id' })
      plantillas.createIndex('nombre', 'nombre')
      plantillas.createIndex('fechaImportacion', 'fechaImportacion')

      const forms = db.createObjectStore('formulariosRellenados', { keyPath: 'id' })
      forms.createIndex('templateId', 'templateId')
      forms.createIndex('estado', 'estado')
      forms.createIndex('fechaModificacion', 'fechaModificacion')

      db.createObjectStore('configuracion', { keyPath: 'clave' })
    },
  })

  return dbInstance
}

// ── Plantillas ────────────────────────────────────────────────────────────────

export type LibraryTemplate = Template & { fechaImportacion: string }

export async function saveTemplateToLibrary(template: LibraryTemplate): Promise<void> {
  const db = await initFillerDB()
  await db.put('plantillas', template)
}

export async function getTemplateFromLibrary(id: string): Promise<LibraryTemplate | undefined> {
  const db = await initFillerDB()
  return db.get('plantillas', id)
}

export async function getAllLibraryTemplates(): Promise<LibraryTemplate[]> {
  const db = await initFillerDB()
  return db.getAll('plantillas')
}

export async function deleteTemplateFromLibrary(id: string): Promise<void> {
  const db = await initFillerDB()
  await db.delete('plantillas', id)
}

// ── Formularios rellenados ────────────────────────────────────────────────────

export async function saveFilledForm(form: FilledForm): Promise<void> {
  const db = await initFillerDB()
  await db.put('formulariosRellenados', form)
}

export async function getFilledForm(id: string): Promise<FilledForm | undefined> {
  const db = await initFillerDB()
  return db.get('formulariosRellenados', id)
}

export async function getAllFilledForms(): Promise<FilledForm[]> {
  const db = await initFillerDB()
  return db.getAll('formulariosRellenados')
}

export async function getFilledFormsByTemplate(templateId: string): Promise<FilledForm[]> {
  const db = await initFillerDB()
  return db.getAllFromIndex('formulariosRellenados', 'templateId', templateId)
}

export async function deleteFilledForm(id: string): Promise<void> {
  const db = await initFillerDB()
  await db.delete('formulariosRellenados', id)
}

export async function updateFilledForm(form: FilledForm): Promise<void> {
  const db = await initFillerDB()
  await db.put('formulariosRellenados', {
    ...form,
    fechaModificacion: new Date().toISOString(),
  })
}

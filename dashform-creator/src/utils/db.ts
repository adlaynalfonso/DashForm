import { openDB, type IDBPDatabase } from 'idb'
import type { Template } from '@/types/template'

const DB_NAME = 'DashFormCreator'
const DB_VERSION = 1

interface CreatorDB {
  plantillas: {
    key: string
    value: Template & { fechaCreacion: string; fechaModificacion: string }
    indexes: {
      nombre: string
      fechaCreacion: string
      fechaModificacion: string
    }
  }
}

type CreatorDBInstance = IDBPDatabase<CreatorDB>

let dbInstance: CreatorDBInstance | null = null

export async function initCreatorDB(): Promise<CreatorDBInstance> {
  if (dbInstance) return dbInstance

  dbInstance = await openDB<CreatorDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      const store = db.createObjectStore('plantillas', { keyPath: 'id' })
      store.createIndex('nombre', 'nombre')
      store.createIndex('fechaCreacion', 'fechaCreacion')
      store.createIndex('fechaModificacion', 'fechaModificacion')
    },
  })

  return dbInstance
}

export type StoredTemplate = Template & {
  fechaCreacion: string
  fechaModificacion: string
}

export async function saveTemplate(template: StoredTemplate): Promise<void> {
  const db = await initCreatorDB()
  await db.put('plantillas', template)
}

export async function getTemplate(id: string): Promise<StoredTemplate | undefined> {
  const db = await initCreatorDB()
  return db.get('plantillas', id)
}

export async function getAllTemplates(): Promise<StoredTemplate[]> {
  const db = await initCreatorDB()
  return db.getAll('plantillas')
}

export async function deleteTemplate(id: string): Promise<void> {
  const db = await initCreatorDB()
  await db.delete('plantillas', id)
}

export async function updateTemplate(template: StoredTemplate): Promise<void> {
  const db = await initCreatorDB()
  await db.put('plantillas', {
    ...template,
    fechaModificacion: new Date().toISOString(),
  })
}

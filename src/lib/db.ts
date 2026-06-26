import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'pdf-forge';
const DB_VERSION = 1;

interface PdfForgeDB {
  projects: {
    key: string;
    value: {
      id: string;
      name: string;
      type: 'single' | 'bulk' | 'merge';
      createdAt: number;
      updatedAt: number;
      thumbnail?: string;
      pageCount?: number;
      fileSize?: number;
    };
    indexes: { 'by-updated': number };
  };
  'pdf-files': {
    key: string;
    value: {
      id: string;
      projectId: string;
      name: string;
      data: ArrayBuffer;
      createdAt: number;
    };
    indexes: { 'by-project': string };
  };
  templates: {
    key: string;
    value: {
      id: string;
      name: string;
      category: string;
      editorState: string;
      thumbnail?: string;
      createdAt: number;
    };
  };
  signatures: {
    key: string;
    value: {
      id: string;
      name: string;
      data: string;
      createdAt: number;
    };
  };
}

let dbInstance: IDBPDatabase<PdfForgeDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<PdfForgeDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<PdfForgeDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      const projectStore = db.createObjectStore('projects', { keyPath: 'id' });
      projectStore.createIndex('by-updated', 'updatedAt');

      const fileStore = db.createObjectStore('pdf-files', { keyPath: 'id' });
      fileStore.createIndex('by-project', 'projectId');

      db.createObjectStore('templates', { keyPath: 'id' });
      db.createObjectStore('signatures', { keyPath: 'id' });
    },
  });

  return dbInstance;
}

// Project helpers
export async function getAllProjects() {
  const db = await getDB();
  return db.getAllFromIndex('projects', 'by-updated');
}

export async function getProject(id: string) {
  const db = await getDB();
  const project = await db.get('projects', id);
  if (!project) return null;
  
  const files = await db.getAllFromIndex('pdf-files', 'by-project', id);
  const fileData = files.length > 0 ? files[0].data : undefined;
  
  return {
    ...project,
    fileData
  };
}

export async function saveProject(project: PdfForgeDB['projects']['value']) {
  const db = await getDB();
  return db.put('projects', project);
}

export async function deleteProject(id: string) {
  const db = await getDB();
  await db.delete('projects', id);
  // Also delete associated files
  const files = await db.getAllFromIndex('pdf-files', 'by-project', id);
  for (const file of files) {
    await db.delete('pdf-files', file.id);
  }
}

// File helpers
export async function savePdfFile(file: PdfForgeDB['pdf-files']['value']) {
  const db = await getDB();
  return db.put('pdf-files', file);
}

export async function getPdfFile(id: string) {
  const db = await getDB();
  return db.get('pdf-files', id);
}

// Template helpers
export async function getAllTemplates() {
  const db = await getDB();
  return db.getAll('templates');
}

export async function saveTemplate(template: PdfForgeDB['templates']['value']) {
  const db = await getDB();
  return db.put('templates', template);
}

// Signature helpers
export async function getAllSignatures() {
  const db = await getDB();
  return db.getAll('signatures');
}

export async function saveSignature(sig: PdfForgeDB['signatures']['value']) {
  const db = await getDB();
  return db.put('signatures', sig);
}

// Storage usage
export async function getStorageUsage(): Promise<{ used: number; quota: number }> {
  if (navigator.storage && navigator.storage.estimate) {
    const estimate = await navigator.storage.estimate();
    return {
      used: estimate.usage ?? 0,
      quota: estimate.quota ?? 0,
    };
  }
  return { used: 0, quota: 0 };
}

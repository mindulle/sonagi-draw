import { join } from 'path'
import Database from 'better-sqlite3'
import { mkdirSync } from 'fs'

const DIR = './.rooms'
mkdirSync(DIR, { recursive: true })

const db = new Database(join(DIR, `shared_library.db`))

db.exec(`
  CREATE TABLE IF NOT EXISTS library_items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    content TEXT NOT NULL
  )
`)

export async function getLibraryItems() {
  const rows = db.prepare('SELECT id, name, content FROM library_items').all() as any[]
  return rows.map(row => {
    let parsedContent;
    try {
      parsedContent = JSON.parse(row.content);
    } catch (e) {
      parsedContent = null;
    }
    return {
      id: row.id,
      name: row.name,
      content: parsedContent
    };
  }).filter(item => item.content !== null);
}

export async function addLibraryItem(item: {id: string, name: string, content: any}) {
  db.prepare('INSERT OR REPLACE INTO library_items (id, name, content) VALUES (?, ?, ?)').run(
    item.id,
    item.name,
    JSON.stringify(item.content)
  )
}

export async function removeLibraryItem(id: string) {
  db.prepare('DELETE FROM library_items WHERE id = ?').run(id)
}

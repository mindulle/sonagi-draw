import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { getLibraryItems, addLibraryItem, removeLibraryItem } from './library'
import Database from 'better-sqlite3'
import { join } from 'path'

// Mock the database for tests or just run on a test file.
// Since it's hardcoded to .rooms/shared_library.db in library.ts, we'll just clean it up.
describe('Library API', () => {
  beforeEach(async () => {
    // Clear items before each test
    const items = await getLibraryItems()
    for (const item of items) {
      await removeLibraryItem(item.id)
    }
  })

  it('should start empty', async () => {
    const items = await getLibraryItems()
    expect(items).toEqual([])
  })

  it('should add an item', async () => {
    await addLibraryItem({ id: '1', name: 'Test Item', content: { type: 'test' } })
    const items = await getLibraryItems()
    expect(items).toHaveLength(1)
    expect(items[0]).toEqual({ id: '1', name: 'Test Item', content: { type: 'test' } })
  })

  it('should remove an item', async () => {
    await addLibraryItem({ id: '2', name: 'Test Item 2', content: { type: 'test' } })
    await removeLibraryItem('2')
    const items = await getLibraryItems()
    expect(items).toEqual([])
  })
})

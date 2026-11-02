import { describe, it, expect } from 'vitest'
import { normalizeTldrawSnapshot } from './snapshotNormalization'

describe('normalizeTldrawSnapshot', () => {
    it('normalizes TLStoreSnapshot format ({ store, schema })', () => {
        const input = {
            schema: { schemaVersion: 2 },
            store: {
                'document:document': { id: 'document:document', typeName: 'document' },
                'page:page': { id: 'page:page', typeName: 'page' }
            }
        }
        const result = normalizeTldrawSnapshot(input)
        expect(result.store['document:document']).toBeDefined()
        expect(result.schema.schemaVersion).toBe(2)
    })

    it('normalizes TLEditorSnapshot format ({ document: { store, schema }, session })', () => {
        const input = {
            document: {
                schema: { schemaVersion: 2 },
                store: {
                    'shape:1': { id: 'shape:1', typeName: 'shape' }
                }
            },
            session: { currentPageId: 'page:page' }
        }
        const result = normalizeTldrawSnapshot(input)
        expect(result.store['shape:1']).toBeDefined()
        expect(result.schema.schemaVersion).toBe(2)
    })

    it('normalizes wrapped payload format ({ file: "...", data: { document: { store, schema } } })', () => {
        const input = {
            file: 'test_drawing',
            data: {
                document: {
                    schema: { schemaVersion: 2 },
                    store: {
                        'shape:boxed': { id: 'shape:boxed', typeName: 'shape' }
                    }
                }
            }
        }
        const result = normalizeTldrawSnapshot(input)
        expect(result.store['shape:boxed']).toBeDefined()
    })

    it('normalizes official tldraw export format with records array ({ schema, records: [...] })', () => {
        const input = {
            tldrawFileFormatVersion: 1,
            schema: { schemaVersion: 2 },
            records: [
                { id: 'document:document', typeName: 'document' },
                { id: 'shape:arrow1', typeName: 'shape' }
            ]
        }
        const result = normalizeTldrawSnapshot(input)
        expect(result.store['shape:arrow1']).toBeDefined()
        expect(result.store['document:document']).toBeDefined()
        expect(result.schema.schemaVersion).toBe(2)
    })

    it('throws descriptive error on invalid inputs', () => {
        expect(() => normalizeTldrawSnapshot(null)).toThrow('올바른 도면 데이터(JSON) 형식이 아닙니다.')
        expect(() => normalizeTldrawSnapshot('not an object')).toThrow('올바른 도면 데이터(JSON) 형식이 아닙니다.')
        expect(() => normalizeTldrawSnapshot({})).toThrow('도면 스토어(store/records) 레코드를 찾을 수 없습니다.')
    })
})

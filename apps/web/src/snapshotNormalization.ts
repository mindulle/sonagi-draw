/**
 * Helper to normalize various Tldraw document snapshot formats into a standard
 * TLStoreSnapshot structure `{ store: Record<string, any>, schema: any }`
 * that can be safely loaded into Tldraw Editor via `editor.loadSnapshot()`.
 */
export function normalizeTldrawSnapshot(raw: any): { store: Record<string, any>; schema: any } {
    if (!raw || typeof raw !== 'object') {
        throw new Error('올바른 도면 데이터(JSON) 형식이 아닙니다.')
    }

    let data = raw

    // 1. Unwrap nested data wrappers (e.g., { file: '...', data: { ... } } or { data: { ... } })
    while (
        data &&
        typeof data === 'object' &&
        'data' in data &&
        !('store' in data) &&
        !('records' in data) &&
        !('document' in data)
    ) {
        data = data.data
    }

    let store: Record<string, any> | null = null
    let schema: any = data.schema

    // 2. Format: TLEditorSnapshot { document: { store, schema }, session }
    if (data.document?.store && typeof data.document.store === 'object') {
        store = { ...data.document.store }
        schema = data.document.schema || data.schema
    }
    // 3. Format: TLStoreSnapshot { store, schema }
    else if (data.store && typeof data.store === 'object' && !Array.isArray(data.store)) {
        store = { ...data.store }
        schema = data.schema
    }
    // 4. Format: Official Tldraw JSON export { tldrawFileFormatVersion: 1, schema, records: [...] }
    else if (Array.isArray(data.records)) {
        store = Object.fromEntries(data.records.map((r: any) => [r.id, r]))
        schema = data.schema
    }
    // 5. Format: document with records array
    else if (Array.isArray(data.document?.records)) {
        store = Object.fromEntries(data.document.records.map((r: any) => [r.id, r]))
        schema = data.document.schema || data.schema
    }

    if (!store || typeof store !== 'object') {
        throw new Error('도면 스토어(store/records) 레코드를 찾을 수 없습니다.')
    }

    // Ensure document:document has required default properties (prevents "At document.gridSize: Expected number" error)
    if (store['document:document']) {
        store['document:document'] = {
            gridSize: 10,
            name: '',
            meta: {},
            ...store['document:document']
        }
    }

    // Ensure page:page has required properties
    for (const record of Object.values(store)) {
        if (record && typeof record === 'object' && record.typeName === 'page') {
            if (!record.meta) record.meta = {}
            if (!record.name) record.name = 'Page 1'
            if (!record.index) record.index = 'a1'
        }
    }

    return {
        store,
        schema
    }
}

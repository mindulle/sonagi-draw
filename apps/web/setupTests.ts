import '@testing-library/jest-dom'

// Mock CSS.supports
if (typeof CSS === 'undefined') {
  ;(global as any).CSS = {}
}
;(global as any).CSS.supports = (k: string, v: string) => false

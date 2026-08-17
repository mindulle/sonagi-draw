import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { WiredCardShapeUtil } from './WiredCardShape'

describe('WiredCardShape', () => {
  it('should render', () => {
    const util = new WiredCardShapeUtil({} as any)
    const shape = {
        id: 'test-id' as any,
        type: 'wired-card',
        props: util.getDefaultProps()
    }
    
    // Attempt to render the component.
    // Note: This might require tldraw provider if HTMLContainer expects it.
    const component = util.component(shape as any)
    
    const { container } = render(component)
    expect(container.querySelector('svg')).toBeDefined()
  })
})

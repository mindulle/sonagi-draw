/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

describe('Sample Test', () => {
  it('should pass a basic truthiness test', () => {
    expect(true).toBe(true)
  })

  it('should render a simple component', () => {
    render(<div>Hello Vitest</div>)
    expect(screen.getByText('Hello Vitest')).toBeInTheDocument()
  })
})
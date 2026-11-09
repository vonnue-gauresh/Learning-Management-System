import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

function SmokeTest() {
  return <h1>LearnHub testing setup</h1>
}

describe('Frontend testing setup', () => {
  it('renders a React component', () => {
    render(<SmokeTest />)

    expect(
      screen.getByRole('heading', { name: 'LearnHub testing setup' }),
    ).toBeInTheDocument()
  })
})
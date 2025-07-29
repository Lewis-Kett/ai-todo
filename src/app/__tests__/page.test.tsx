import { render, screen } from '@testing-library/react'
import Home from '../page'

describe('Home Page', () => {
  it('renders the main heading', () => {
    render(<Home />)
    
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toBeInTheDocument()
    expect(heading).toHaveTextContent('AI Todo')
  })

  it('renders the description text', () => {
    render(<Home />)
    
    expect(screen.getByText('Manage your tasks efficiently')).toBeInTheDocument()
  })

  it('renders the add task form', () => {
    render(<Home />)
    
    expect(screen.getByRole('form', { name: /add new task/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/task description/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add new task/i })).toBeInTheDocument()
  })

  it('renders the tasks section', () => {
    render(<Home />)
    
    expect(screen.getByText('Tasks')).toBeInTheDocument()
    expect(screen.getByText('3 pending')).toBeInTheDocument()
  })

  it('renders sample todo items', () => {
    render(<Home />)
    
    expect(screen.getByText('Complete the project documentation')).toBeInTheDocument()
    expect(screen.getByText('Review pull requests')).toBeInTheDocument()
    expect(screen.getByText('Set up development environment')).toBeInTheDocument()
  })

  it('renders task statistics', () => {
    render(<Home />)
    
    expect(screen.getByText('2 tasks pending • 1 completed • 3 total')).toBeInTheDocument()
  })

  it('has proper accessibility structure', () => {
    render(<Home />)
    
    expect(screen.getByRole('banner')).toBeInTheDocument() // header
    expect(screen.getByRole('main')).toBeInTheDocument() // main
    expect(screen.getByRole('contentinfo')).toBeInTheDocument() // footer
  })
})
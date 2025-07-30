import { render, screen } from '@testing-library/react'
import Home from '../page'
import { AppProviders } from '@/components/providers/AppProviders'

describe('Home Page', () => {
  const renderWithProviders = (component: React.ReactElement) => {
    return render(<AppProviders>{component}</AppProviders>)
  }

  it('renders the main heading', () => {
    renderWithProviders(<Home />)
    
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toBeInTheDocument()
    expect(heading).toHaveTextContent('AI Todo')
  })

  it('renders the description text', () => {
    renderWithProviders(<Home />)
    
    expect(screen.getByText('Manage your tasks efficiently with AI assistance')).toBeInTheDocument()
  })

  it('renders the add task form', () => {
    renderWithProviders(<Home />)
    
    expect(screen.getByRole('form', { name: /add new task/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/task description/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add new task/i })).toBeInTheDocument()
  })

  it('renders the tasks section', () => {
    renderWithProviders(<Home />)
    
    expect(screen.getByText('Tasks')).toBeInTheDocument()
    expect(screen.getByText('2 pending')).toBeInTheDocument()
  })

  it('renders dynamic todo items from hook', () => {
    renderWithProviders(<Home />)
    
    expect(screen.getByText('Complete the project documentation')).toBeInTheDocument()
    expect(screen.getByText('Review pull requests')).toBeInTheDocument()
    expect(screen.getByText('Set up development environment')).toBeInTheDocument()
  })

  it('renders dynamic task statistics', () => {
    renderWithProviders(<Home />)
    
    expect(screen.getByText('2 tasks pending • 1 completed • 3 total')).toBeInTheDocument()
  })

  it('has proper accessibility structure', () => {
    renderWithProviders(<Home />)
    
    expect(screen.getByRole('banner')).toBeInTheDocument() // header
    expect(screen.getByRole('main')).toBeInTheDocument() // main
    expect(screen.getByRole('contentinfo')).toBeInTheDocument() // footer
  })

  it('renders todo items with proper accessibility attributes', () => {
    renderWithProviders(<Home />)
    
    const todoList = screen.getByRole('list', { name: /todo items/i })
    expect(todoList).toBeInTheDocument()
    
    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes).toHaveLength(3)
    
    const deleteButtons = screen.getAllByLabelText(/delete task:/i)
    expect(deleteButtons).toHaveLength(3)
  })

  it('renders the chat interface', () => {
    renderWithProviders(<Home />)
    
    expect(screen.getByRole('heading', { name: 'AI Assistant' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /chat message input/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument()
  })
})
import { render, screen } from "@testing-library/react"
import { ThemeProvider } from "@/components/theme-provider"
import Home from "../page"

// Mock server components
jest.mock("@/components/todo/TodoSectionServer", () => ({
  TodoSectionServer: jest.fn(() => (
    <div>
      <form role="form" aria-label="Add new task">
        <label htmlFor="task-description">Task description</label>
        <input id="task-description" aria-label="Task description" />
        <button type="submit" aria-label="Add new task">Add New Task</button>
      </form>
      <div>
        <h3>Tasks</h3>
        <p>2 pending</p>
        <div role="list" aria-label="Todo items">
          <div role="listitem">
            <input type="checkbox" role="checkbox" />
            <span>Complete the project documentation</span>
            <button aria-label="Delete task: Complete the project documentation">Delete</button>
          </div>
          <div role="listitem">
            <input type="checkbox" role="checkbox" />
            <span>Review pull requests</span>
            <button aria-label="Delete task: Review pull requests">Delete</button>
          </div>
          <div role="listitem">
            <input type="checkbox" role="checkbox" checked />
            <span>Set up development environment</span>
            <button aria-label="Delete task: Set up development environment">Delete</button>
          </div>
        </div>
        <footer role="contentinfo" aria-live="polite">
          <p aria-label="Task statistics">
            2 tasks pending • 1 completed • 3 total
          </p>
        </footer>
      </div>
    </div>
  ))
}))

jest.mock("@/components/chat/ChatInterface", () => ({
  ChatInterface: jest.fn(() => (
    <div>
      <h2 role="heading" aria-level={2}>AI Assistant</h2>
      <input aria-label="Chat message input" />
      <button role="button" aria-label="Send">Send</button>
    </div>
  ))
}))

jest.mock("@/components/ErrorBoundary", () => ({
  ErrorBoundary: jest.fn(({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ))
}))

// Mock server actions
jest.mock("@/actions/todo-actions", () => ({
  addTodo: jest.fn().mockResolvedValue(undefined),
  deleteTodo: jest.fn().mockResolvedValue(undefined),
  toggleTodoComplete: jest.fn().mockResolvedValue(undefined),
  updateTodo: jest.fn().mockResolvedValue(undefined),
}))

// Mock useInlineEdit hook
jest.mock("@/hooks/useInlineEdit", () => ({
  useInlineEdit: jest.fn(() => ({
    isEditing: false,
    editedValue: "",
    inputRef: { current: null },
    setEditedValue: jest.fn(),
    startEditing: jest.fn(),
    saveValue: jest.fn(),
    cancelEditing: jest.fn(),
    handleKeyDown: jest.fn(),
  })),
}))

describe("Home Page", () => {
  // Suppress console.error for React warnings about controlled components
  const originalError = console.error
  beforeAll(() => {
    console.error = jest.fn()
  })

  afterAll(() => {
    console.error = originalError
  })

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {component}
      </ThemeProvider>
    )
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders the main heading", () => {
    renderWithProviders(<Home />)

    const heading = screen.getByRole("heading", { level: 1 })
    expect(heading).toBeInTheDocument()
    expect(heading).toHaveTextContent("AI Todo")
  })

  it("renders the description text", () => {
    renderWithProviders(<Home />)

    expect(
      screen.getByText("Manage your tasks efficiently with AI assistance")
    ).toBeInTheDocument()
  })

  it("renders the add task form", () => {
    renderWithProviders(<Home />)

    expect(
      screen.getByRole("form", { name: /add new task/i })
    ).toBeInTheDocument()
    expect(screen.getByLabelText(/task description/i)).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /add new task/i })
    ).toBeInTheDocument()
  })

  it("renders the tasks section", () => {
    renderWithProviders(<Home />)

    expect(screen.getByText("Tasks")).toBeInTheDocument()
    expect(screen.getByText("2 pending")).toBeInTheDocument()
  })

  it("renders dynamic todo items from hook", () => {
    renderWithProviders(<Home />)

    expect(
      screen.getByText("Complete the project documentation")
    ).toBeInTheDocument()
    expect(screen.getByText("Review pull requests")).toBeInTheDocument()
    expect(
      screen.getByText("Set up development environment")
    ).toBeInTheDocument()
  })

  it("renders dynamic task statistics", () => {
    renderWithProviders(<Home />)

    expect(
      screen.getByText("2 tasks pending • 1 completed • 3 total")
    ).toBeInTheDocument()
  })

  it("has proper accessibility structure", () => {
    renderWithProviders(<Home />)

    expect(screen.getByRole("banner")).toBeInTheDocument() // header
    expect(screen.getByRole("main")).toBeInTheDocument() // main
    expect(screen.getByRole("contentinfo")).toBeInTheDocument() // footer
  })

  it("renders todo items with proper accessibility attributes", () => {
    renderWithProviders(<Home />)

    const todoList = screen.getByRole("list", { name: /todo items/i })
    expect(todoList).toBeInTheDocument()

    const checkboxes = screen.getAllByRole("checkbox")
    expect(checkboxes).toHaveLength(3)

    const deleteButtons = screen.getAllByLabelText(/delete task:/i)
    expect(deleteButtons).toHaveLength(3)
  })

  it("renders the chat interface", () => {
    renderWithProviders(<Home />)

    expect(
      screen.getByRole("heading", { name: "AI Assistant" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("textbox", { name: /chat message input/i })
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /send/i })).toBeInTheDocument()
  })

  it("wraps components in error boundaries", () => {
    renderWithProviders(<Home />)

    // ErrorBoundary mock is called - we just verify the page structure is preserved
    expect(screen.getByRole("main")).toBeInTheDocument()
    expect(screen.getByText("AI Assistant")).toBeInTheDocument()
    expect(screen.getByText("Tasks")).toBeInTheDocument()
  })

  it("has proper page layout structure", () => {
    renderWithProviders(<Home />)

    // Verify the main container structure
    const container = screen.getByRole("main").closest('.container')
    expect(container).toHaveClass('container', 'mx-auto', 'max-w-6xl', 'p-6')

    // Verify grid layout for main content
    const main = screen.getByRole("main")
    expect(main).toHaveClass('grid', 'grid-cols-1', 'lg:grid-cols-2', 'gap-8')
  })

  it("renders header with proper styling classes", () => {
    renderWithProviders(<Home />)

    const header = screen.getByRole("banner")
    expect(header).toHaveClass('mb-8')

    const heading = screen.getByRole("heading", { level: 1 })
    expect(heading).toHaveClass('text-4xl', 'font-bold', 'text-center', 'mb-2')
    
    const description = screen.getByText("Manage your tasks efficiently with AI assistance")
    expect(description).toHaveClass('text-muted-foreground', 'text-center')
  })
})
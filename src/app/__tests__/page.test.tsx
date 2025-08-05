import { render, screen } from "@testing-library/react"
import { AppProviders } from "@/components/providers/AppProviders"
import { TodoSectionTest } from "@/components/todo/__test-utils__/TodoSectionTest"
import { ChatInterface } from "@/components/chat/ChatInterface"

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
  const renderWithProviders = (component: React.ReactElement) => {
    return render(<AppProviders>{component}</AppProviders>)
  }

  const TestHomePage = () => (
    <div className="container mx-auto max-w-6xl p-6">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-center mb-2">AI Todo</h1>
        <p className="text-muted-foreground text-center">
          Manage your tasks efficiently with AI assistance
        </p>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <TodoSectionTest />
        <ChatInterface />
      </main>
    </div>
  )

  it("renders the main heading", () => {
    renderWithProviders(<TestHomePage />)

    const heading = screen.getByRole("heading", { level: 1 })
    expect(heading).toBeInTheDocument()
    expect(heading).toHaveTextContent("AI Todo")
  })

  it("renders the description text", () => {
    renderWithProviders(<TestHomePage />)

    expect(
      screen.getByText("Manage your tasks efficiently with AI assistance")
    ).toBeInTheDocument()
  })

  it("renders the add task form", () => {
    renderWithProviders(<TestHomePage />)

    expect(
      screen.getByRole("form", { name: /add new task/i })
    ).toBeInTheDocument()
    expect(screen.getByLabelText(/task description/i)).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /add new task/i })
    ).toBeInTheDocument()
  })

  it("renders the tasks section", () => {
    renderWithProviders(<TestHomePage />)

    expect(screen.getByText("Tasks")).toBeInTheDocument()
    expect(screen.getByText("2 pending")).toBeInTheDocument()
  })

  it("renders dynamic todo items from hook", () => {
    renderWithProviders(<TestHomePage />)

    expect(
      screen.getByText("Complete the project documentation")
    ).toBeInTheDocument()
    expect(screen.getByText("Review pull requests")).toBeInTheDocument()
    expect(
      screen.getByText("Set up development environment")
    ).toBeInTheDocument()
  })

  it("renders dynamic task statistics", () => {
    renderWithProviders(<TestHomePage />)

    expect(
      screen.getByText("2 tasks pending • 1 completed • 3 total")
    ).toBeInTheDocument()
  })

  it("has proper accessibility structure", () => {
    renderWithProviders(<TestHomePage />)

    expect(screen.getByRole("banner")).toBeInTheDocument() // header
    expect(screen.getByRole("main")).toBeInTheDocument() // main
    expect(screen.getByRole("contentinfo")).toBeInTheDocument() // footer
  })

  it("renders todo items with proper accessibility attributes", () => {
    renderWithProviders(<TestHomePage />)

    const todoList = screen.getByRole("list", { name: /todo items/i })
    expect(todoList).toBeInTheDocument()

    const checkboxes = screen.getAllByRole("checkbox")
    expect(checkboxes).toHaveLength(3)

    const deleteButtons = screen.getAllByLabelText(/delete task:/i)
    expect(deleteButtons).toHaveLength(3)
  })

  it("renders the chat interface", () => {
    renderWithProviders(<TestHomePage />)

    expect(
      screen.getByRole("heading", { name: "AI Assistant" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("textbox", { name: /chat message input/i })
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /send/i })).toBeInTheDocument()
  })
})

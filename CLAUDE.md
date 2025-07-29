# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an AI-powered todo application built with Next.js 15, React 19, and TypeScript. The project uses Tailwind CSS v4 for styling and follows the modern Next.js App Router architecture.

## Development Commands

- `npm run dev` - Start development server with Turbopack (runs on http://localhost:3000)
- `npm run build` - Build production bundle
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code quality checks

## Architecture

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript with strict mode enabled
- **Styling**: Tailwind CSS v4 with PostCSS
- **UI Components**: shadcn/ui with New York style, neutral base color
- **Project Structure**:
  - `src/app/` - Next.js App Router pages and layouts
  - `src/app/layout.tsx` - Root layout with metadata for "AI Todo" app
  - `src/app/page.tsx` - Home page (currently minimal/empty)
  - `src/app/globals.css` - Global styles with Tailwind imports and shadcn/ui variables
  - `src/lib/utils.ts` - Utility functions including cn() for class merging
  - `src/components/ui/` - shadcn/ui components (installed as needed)
  - `public/` - Static assets (currently empty)

## Configuration Details

- Uses path aliases: `@/*` maps to `./src/*`
- ESLint configured with Next.js core web vitals and TypeScript rules
- Tailwind CSS v4 with inline theme configuration using CSS variables
- Dark mode support via CSS class-based theming (.dark)
- shadcn/ui configured with component aliases (@/components/ui, @/lib/utils)
- TypeScript target: ES2017 with strict mode and bundler module resolution
- Icons: Lucide React library

## shadcn/ui Commands

- `npx shadcn@latest add [component]` - Add specific UI components
- `npx shadcn@latest add button` - Example: add button component
- Components are installed to `src/components/ui/` directory

## Front-end Development Guidelines

When performing front-end work, Claude should use the shadcn MCP server to:
- Discover available shadcn/ui components with `mcp__shadcn__list_components`
- Get component source code with `mcp__shadcn__get_component`
- Get component demo/usage examples with `mcp__shadcn__get_component_demo`
- Get component metadata with `mcp__shadcn__get_component_metadata`

This ensures consistent UI patterns and proper component implementation.

### Accessibility & Semantic Markup Requirements

Claude must always prioritize accessibility (A11Y) and semantic correctness when developing:

- **Semantic HTML**: Use appropriate HTML elements for their intended purpose (e.g., `<button>` for interactive elements, `<main>` for primary content, `<nav>` for navigation)
- **ARIA Labels**: Provide descriptive aria-labels for screen readers when content isn't self-explanatory
- **Keyboard Navigation**: Ensure all interactive elements are keyboard accessible with proper focus management
- **Color Contrast**: Maintain WCAG AA compliance for text and background color combinations
- **Focus Indicators**: Provide clear visual focus indicators for keyboard navigation
- **Screen Reader Support**: Structure content logically with proper heading hierarchy (h1-h6) and landmark elements
- **Form Accessibility**: Include proper labels, error states, and validation messages for form inputs
- **Alternative Text**: Provide meaningful alt text for images and icons that convey information

These accessibility standards are non-negotiable and must be implemented in all UI components and layouts.

## Software Development Principles

### DRY Principle (Don't Repeat Yourself)

Claude must strictly adhere to the DRY principle, which states that "Every piece of knowledge must have a single, unambiguous, authoritative representation within a system."

**Core Guidelines:**
- Eliminate code duplication through abstraction and reusable components
- Extract common functionality into utility functions, custom hooks, or shared components
- Use configuration objects and constants instead of repeating magic numbers or strings
- Create reusable TypeScript types and interfaces to avoid duplicating type definitions
- Implement shared validation logic, API calls, and business logic in centralized modules

**Benefits:**
- Reduces maintenance burden by requiring changes in only one location
- Minimizes bugs caused by inconsistent updates across duplicated code
- Improves code readability and reduces technical debt
- Ensures consistent behavior across the application

**Application in React/Next.js:**
- Extract common UI patterns into reusable components
- Use custom hooks for shared stateful logic
- Create utility functions for common operations (formatting, validation, etc.)
- Centralize API endpoints and data fetching logic
- Share component prop types and interfaces

### SOLID Principles

Claude must follow the five SOLID principles of object-oriented design to create maintainable, flexible, and extensible code:

#### 1. Single Responsibility Principle (SRP)
- Each component, function, or class should have only one reason to change
- Components should focus on a single piece of functionality
- Separate concerns like data fetching, UI rendering, and business logic
- Create focused utility functions that handle one specific task

#### 2. Open/Closed Principle (OCP)
- Code should be open for extension but closed for modification
- Use composition over inheritance in React components
- Design components to accept props and render props for extensibility
- Create plugin-style architectures where new features can be added without changing existing code
- Use TypeScript generics and interfaces to allow extension without modification

#### 3. Liskov Substitution Principle (LSP)
- Derived components should be substitutable for their base components
- Ensure component interfaces are consistent and predictable
- Maintain expected behavior when extending or wrapping components
- Honor the contracts established by parent components or interfaces

#### 4. Interface Segregation Principle (ISP)
- Components should not depend on props they don't use
- Create focused, minimal prop interfaces
- Split large prop interfaces into smaller, specific ones
- Use composition to combine multiple small interfaces when needed
- Avoid forcing components to accept unnecessary dependencies

#### 5. Dependency Inversion Principle (DIP)
- High-level components should not depend on low-level implementation details
- Depend on abstractions (interfaces, types) rather than concrete implementations
- Use dependency injection patterns through props, context, or hooks
- Abstract external dependencies (APIs, third-party libraries) behind interfaces
- Design components to work with any implementation that satisfies the interface

**SOLID Benefits:**
- **Maintainability**: Code is easier to understand, modify, and extend
- **Testability**: Components can be tested in isolation with mocked dependencies
- **Flexibility**: New features can be added with minimal impact on existing code
- **Reduced Coupling**: Components are loosely coupled and highly cohesive
- **Better Architecture**: Promotes clean, scalable system design

## Test-Driven Development (TDD)

This project follows Test-Driven Development principles to ensure high-quality, maintainable code. TDD is a software development practice where tests are written before the implementation code.

### The Red-Green-Refactor Cycle

TDD follows a disciplined three-step cycle:

1. **Red**: Write a failing test for the desired functionality
2. **Green**: Write the minimum code necessary to make the test pass
3. **Refactor**: Clean up and improve the code while keeping all tests green

### The Three Laws of TDD

Claude must adhere to Robert C. Martin's three laws of TDD:

1. **First Law**: You are not allowed to write any production code unless it is to make a failing unit test pass
2. **Second Law**: You are not allowed to write any more of a unit test than is sufficient to fail (compilation failures count as failures)
3. **Third Law**: You are not allowed to write any more production code than is sufficient to pass the one failing unit test

### TDD Best Practices

- **Start Simple**: Begin with the most basic functionality and gradually build complexity
- **One Test at a Time**: Focus on making one test pass before writing the next test
- **Descriptive Test Names**: Use clear, descriptive test names that explain what behavior is being verified
- **Small, Focused Tests**: Each test should verify a single aspect of functionality
- **Test Behavior, Not Implementation**: Focus on what the code does, not how it does it
- **Comprehensive Coverage**: Include happy path, edge cases, error conditions, and boundary values
- **Refactor Fearlessly**: Use the safety net of tests to improve code design continuously

### TDD Workflow for New Features

When implementing new functionality:

1. **Understand Requirements**: Clarify what the feature should do
2. **Write the Test**: Create a failing test that describes the expected behavior
3. **Run the Test**: Confirm it fails for the right reason (Red)
4. **Implement**: Write minimal code to make the test pass (Green)
5. **Refactor**: Improve code quality while maintaining test coverage
6. **Repeat**: Continue the cycle for additional functionality

### Integration with CI/CD

TDD aligns perfectly with our automated quality checks:
- Tests run automatically after code changes via hooks
- Failing tests prevent code progression
- Continuous feedback ensures code quality throughout development

## Testing Guidelines

### Test-Driven Development Principles

- **Code Quality Over Test Convenience**: Never modify production code solely to make tests pass. If a test fails due to implementation details, modify the test instead.
- **Component Pattern Adherence**: Always prioritize following established patterns (like shadcn/ui component usage) over making tests simpler to write.
- **Test Implementation Reality**: Tests should verify actual component behavior, not idealized behavior. For example, if shadcn/ui `CardTitle` renders as a `div` rather than a heading element, tests should reflect this reality.
- **Semantic vs Implementation Testing**: When testing UI components, focus on user-visible behavior and accessibility rather than internal DOM structure. Use appropriate queries that match how users and assistive technologies interact with components.

### Testing Commands

- `npm run test` - Run all tests once
- `npm run test:watch` - Run tests in watch mode during development  
- `npm run test:coverage` - Generate test coverage report

### Automated Quality Checks

**Automated Hook System**: Quality checks are automatically enforced via hooks:

- **PostToolUse Hook**: Automatically runs after any `Write`, `Edit`, or `MultiEdit` operations
- **Tests**: `npm run test` is executed to ensure all tests pass
- **Linting**: `npm run lint` is executed to ensure code quality standards
- **Failure Handling**: If either check fails, the hook reports the error and Claude must fix issues before proceeding

Configuration files:
- `.claude/settings.json` - Hook configuration
- `.claude/hooks/quality-check.sh` - Quality check script

This automated system ensures consistent code quality without manual intervention.

## Commit Guidelines

When creating commits, use only a single short commit message describing the changes. Do not include co-author information or additional formatting.

## Current State

This is an AI-powered todo application with a complete UI implementation featuring shadcn/ui components, comprehensive test coverage with Jest and React Testing Library, and automated quality checks via hooks.
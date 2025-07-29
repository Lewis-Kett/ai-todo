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
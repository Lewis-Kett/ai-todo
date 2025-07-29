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

## Commit Guidelines

When creating commits, use only a single short commit message describing the changes. Do not include co-author information or additional formatting.

## Current State

This appears to be a fresh Next.js project that has been cleaned up from the default create-next-app template. The main page is currently empty, suggesting this is ready for AI todo functionality to be implemented.
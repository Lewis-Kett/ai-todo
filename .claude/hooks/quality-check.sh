#!/bin/bash

# Quality check hook for Claude Code
# Runs tests and linting after code changes

set -e  # Exit on any error

echo "🔍 Running quality checks..."

# Change to project directory
cd "$CLAUDE_PROJECT_DIR"

# Check if package.json exists (to ensure we're in a Node.js project)
if [ ! -f "package.json" ]; then
    echo "⚠️  No package.json found, skipping quality checks"
    exit 0
fi

# Run tests
echo "🧪 Running tests..."
if npm run test --silent; then
    echo "✅ Tests passed"
else
    echo "❌ Tests failed - please fix before proceeding"
    exit 1
fi

# Run linter
echo "🔧 Running linter..."
if npm run lint --silent; then
    echo "✅ Linting passed"
else
    echo "❌ Linting failed - please fix before proceeding"
    exit 1
fi

echo "🎉 All quality checks passed!"
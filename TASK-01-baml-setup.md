# TASK-01: BAML Setup and Installation

## Overview
Set up BAML (Boundary ML) in the AI Todo application with basic configuration and dependencies.

## Objectives
- Install BAML dependencies and VSCode extension
- Initialize BAML project structure
- Configure Next.js with BAML plugin
- Set up environment variables for LLM API access

## Prerequisites
- Existing Next.js 15 project with TypeScript
- Node.js and npm installed
- VSCode or Cursor editor (recommended)

## Steps

### 1. Install Dependencies
```bash
npm install @boundaryml/baml @boundaryml/baml-nextjs-plugin
```

### 2. Install VSCode Extension
- Open VSCode/Cursor
- Install "BAML Extension" from marketplace
- Extension ID: `boundary.baml-extension`

### 3. Initialize BAML Project
```bash
npx baml-cli init
```
This creates:
- `baml_src/` directory with initial BAML files
- `baml_client/` directory for generated code

### 4. Configure Next.js
Update `next.config.js`:
```javascript
const { createBAMLPlugin } = require('@boundaryml/baml-nextjs-plugin');

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: {
      rules: {
        '*.baml': {
          loaders: ['@boundaryml/baml-nextjs-plugin/loader'],
        },
      },
    },
  },
};

module.exports = createBAMLPlugin()(nextConfig);
```

### 5. Environment Variables
Create/update `.env.local`:
```
OPENAI_API_KEY=your_openai_api_key_here
# Or other LLM provider keys as needed
```

### 6. Update Package.json Scripts
Add BAML generation script:
```json
{
  "scripts": {
    "baml-generate": "baml-cli generate",
    "build": "npm run baml-generate && next build",
    "dev": "npm run baml-generate && next dev --turbo"
  }
}
```

### 7. Generate TypeScript Client
```bash
npx baml-cli generate
```

### 8. Verify Setup
- Check that `baml_client/` contains generated TypeScript files
- Ensure VSCode extension provides syntax highlighting for `.baml` files
- Verify development server starts without errors

## Success Criteria
- [ ] BAML dependencies installed successfully
- [ ] VSCode extension provides BAML syntax highlighting
- [ ] `baml_src/` and `baml_client/` directories created
- [ ] Next.js configuration updated with BAML plugin
- [ ] Environment variables configured
- [ ] TypeScript client generated successfully
- [ ] Development server runs without errors

## Next Task
After completing this setup, proceed to TASK-02-baml-functions.md to define core BAML functions for the chat system.

## Troubleshooting
- If generation fails, check that BAML CLI is properly installed
- Ensure environment variables are set correctly
- Verify Next.js version compatibility with BAML plugin
- Check VSCode extension is enabled and working
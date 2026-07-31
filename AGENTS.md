# AGENTS.md

## Purpose
This file helps AI coding agents understand the repository structure, build/test commands, and common frontend conventions for this React + TypeScript app.

## Project overview
- Frontend application bootstrapped with Create React App.
- Uses TypeScript, React 18, Redux Toolkit, React Router v6, SCSS, and a large UI component structure.
- No backend code is included in this repository.

## Key commands
- `npm install` — install dependencies
- `npm start` — run development server
- `npm test` — run tests
- `npm run build` — build production bundle

## Important files
- `package.json` — scripts, dependencies, repo metadata
- `README.md` — bootstrapped CRA instructions and project overview
- `tsconfig.json` — TypeScript config
- `src/index.tsx` — app entry point
- `src/App.tsx` — main application shell

## Important directories
- `src/Routes/` — route definitions and auth protection
- `src/pages/` — page views and screen-level components
- `src/Components/` — reusable UI components
- `src/Layouts/` — app layout components and navigation
- `src/services/` — API/service wrappers
- `src/slices/` — Redux slices and async thunks
- `src/assets/scss/` — global styles, plugins, themes, structure
- `src/locales/` — translation JSON files
- `src/types/` — shared TypeScript types and interfaces
- `src/helpers/` — helper functions and utilities

## Style and UI conventions
- Most UI is styled with SCSS in `src/assets/scss/` and component-specific classes.
- Some interactive elements also use inline style attributes such as `style={{ cursor: "pointer" }}`.
- Cursor behavior is defined both in SCSS and inline style, so search both code and styles when adjusting pointer states.

## Notes for agents
- Preserve existing app structure and naming patterns when adding new pages or components.
- Reuse existing services/slices rather than introducing new parallel state systems.
- Prefer `src/Routes/` and `src/pages/` for new screens and route registration.
- Use translation keys only if the page already uses i18n; otherwise, follow existing page patterns.

## References
- [README.md](README.md)
- [package.json](package.json)

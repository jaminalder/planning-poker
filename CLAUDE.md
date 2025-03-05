# CLAUDE.md - Planning Poker App

## Build & Development Commands
- `npm run dev` - Start development server with Vite
- `npm run build` - Build for production
- `npm run lint` - Run ESLint (checks all JS/JSX files)
- `npm run preview` - Preview production build

## Code Style Guidelines
- **Component Structure**: Functional components with React hooks
- **Imports Order**: 1) React/router, 2) Hooks, 3) External libraries, 4) Components, 5) Utils
- **Naming**: PascalCase for components, camelCase for variables/functions
- **State Management**: React hooks (useState, useContext) for local/global state
- **Error Handling**: Try/catch blocks with specific error messages and console logging
- **Formatting**: 2-space indentation, JSX in parentheses, trailing commas
- **Conditional Rendering**: Ternary operators for simple conditions, && for presence checks

## Technology Stack
- React 19 with React Router v7
- Vite as build tool and dev server
- Supabase for backend/database
- Bulma for styling/components
- ESLint with react-hooks plugin

## Project Structure
- `/src` - Application source code
  - `/components` - Reusable UI components
  - `/contexts` - React context providers
  - `/hooks` - Custom React hooks
  - `/lib` - Third-party service integrations (Supabase)
  - `/pages` - Route-level page components
  - `/utils` - Utility functions and helpers
# Driveline — React + Vite Admin Dashboard

**Driveline** is a modular, type-safe admin dashboard engineered with React 19, TypeScript, and Vite, leveraging Zustand for efficient state management and Axios for robust API interactions. The architecture emphasizes separation of concerns, with centralized routing, DTO-based type safety, and optimized build outputs for production deployment.

## Architecture Overview

The application follows a layered architecture designed for scalability and maintainability:

- **Presentation Layer**: React components with TypeScript for compile-time type checking.
- **State Management Layer**: Zustand stores with persistence middleware for client-side state.
- **API Layer**: Axios-based client with request/response interceptors handling authentication and error management.
- **Data Layer**: Type-safe DTOs ensuring consistent data structures across the application.
- **Routing Layer**: React Router with lazy-loaded components and protected routes.

### Key Design Decisions

- **Modular Component Structure**: Pages are organized under `src/pages/`, with shared components in `src/pages/common/`.
- **Centralized Configuration**: Routes, API endpoints, and constants are defined in dedicated modules (`src/routes/`, `src/api/config.ts`).
- **Type Safety**: Strict TypeScript usage with DTOs in `src/dto/` to enforce data contracts.
- **Lazy Loading**: Route-based code splitting using React.lazy() to minimize initial bundle size.
- **State Persistence**: Zustand stores utilize localStorage for offline-capable state management.

## Tech Stack & Dependencies

- **Frontend Framework**: React 19.2.0 with React DOM 19.2.0
- **Build Tool**: Vite 7.2.4 with @vitejs/plugin-react for fast HMR and optimized builds
- **Type System**: TypeScript 5.9.3 with strict mode enabled
- **State Management**: Zustand 5.0.9 with persist middleware
- **Routing**: React Router DOM 7.9.4 with lazy loading and protected routes
- **HTTP Client**: Axios 1.13.2 with interceptors for auth headers and error handling
- **Linting**: ESLint 9.39.1 with TypeScript ESLint and React hooks plugins
- **Development Server**: Vite dev server with proxy configuration for API requests

## State Management

Zustand stores are implemented per domain (e.g., `UsersStore`, `CoursesStore`) with the following patterns:

- **Async Data Fetching**: Stores handle API calls with loading states and error management.
- **Persistence**: Automatic localStorage persistence for offline functionality.
- **Immutability**: State updates follow immutable patterns to prevent side effects.
- **Type Safety**: Store interfaces are strictly typed, integrating with DTOs.

Example store structure:
```typescript
interface UserStore {
  users: User[];
  loading: boolean;
  fetchUsers: (search?: string, force?: boolean) => Promise<boolean>;
  // ... additional actions
}
```

## API Integration

The API client (`src/api/client.ts`) abstracts HTTP interactions:

- **Base Configuration**: Centralized in `src/api/config.ts` with endpoints and headers.
- **Authentication**: Request interceptors inject JWT tokens, user IDs, and admin keys.
- **Error Handling**: Response interceptors manage global error states and logging.
- **Environment Flexibility**: Supports multiple environments via `secure-config.ts`.

Endpoints are parameterized functions ensuring type-safe URL construction:
```typescript
export const ENDPOINTS = {
  users: {
    getAll: (search: string | undefined, limit: number, skip: number) => `/api/v1/users/all?search=${encodeURIComponent(search)}&limit=${limit}&skip=${skip}`,
    // ...
  },
};
```

## Routing & Navigation

Routing is centralized in `src/routes/index.ts` with:

- **Route Constants**: Immutable route definitions preventing hard-coded paths.
- **Navigation Items**: Structured nav configuration with disabled states.
- **Protected Routes**: Authentication guards using storage utilities.
- **Lazy Loading**: Components loaded on-demand to reduce initial bundle size.

## Build Configuration

Vite configuration (`vite.config.ts`) optimizes for production:

- **Chunk Splitting**: Manual vendor chunks for React, Router, and other libraries.
- **Proxy Setup**: Development proxy to backend API at `http://localhost:3000`.
- **Build Limits**: Chunk size warnings set to 700KB for monitoring bundle growth.

## Development Workflow

### Prerequisites
- Node.js >= 18
- npm or yarn

### Setup
```bash
git clone https://github.com/OmAr-Kader/driveline-react-vite-dashboard.git
cd driveline-react-vite-dashboard
npm install
npm run dev
```

### Build Pipeline
```bash
npm run build  # TypeScript compilation + Vite build
npm run lint   # ESLint checks
npm run preview # Local production preview
```

### Development Notes
- **Type Checking**: Integrated into build process with `tsc -b`.
- **Code Splitting**: Route-based lazy loading reduces initial load times.
- **Storage Utilities**: Custom hooks for auth and navigation persistence.
- **Utility Functions**: Object diffing and cleaning utilities in `src/utils/` for efficient data handling.

## Performance Considerations

- **Bundle Optimization**: Vite's tree-shaking and chunking minimize payload sizes.
- **Lazy Loading**: Components loaded on route activation.
- **State Efficiency**: Zustand's lightweight nature with selective re-renders.
- **API Efficiency**: Pagination and search parameters reduce data transfer.
- **Caching**: LocalStorage persistence enables offline state access.

## Contributing

Contributions should maintain architectural integrity:
- Preserve type safety and DTO contracts.
- Follow existing patterns for stores and API interactions.
- Ensure new routes are added to centralized configuration.
- Test state management and API integrations thoroughly.

For issues or features, submit PRs with detailed technical rationale.

## License

This project is open source. See the `LICENSE` file for details.

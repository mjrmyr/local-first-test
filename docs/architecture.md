# Application Architecture

## Core Principles
- **Privacy-first**: No backend, no cloud, no telemetry. Data lives exclusively in the user's IndexedDB.
- **Offline-first**: All features work without a network connection. The app is a PWA with a service worker.
- **Web-first**: Built on web technologies only. No native code, no app store required.

## Technology Stack
- UI: React + Typescript
- State: Local component state (`useState` / `useReducer`). No global state library.
- Business Logic: Typescript
- Storage: IndexedDB via [Dexie.js](https://dexie.org/)

## Data Flow

### Write Operations

#### Edit Flow
1. **User Edits** → Component updates local state (useState/useReducer)
2. **Validation** → Validate on input, show errors inline
3. **UI Update** → React re-renders with new local state

#### Save Flow
1. **User Clicks Save** → Component calls service with local state
2. **Service Layer** → Validates + writes to IndexedDB
3. **UI Update** → On success: mark as clean
                 → On failure: show error, state unchanged

### Read Operations
1. **Component Mount** → Triggers data fetch (via `useEffect`)
2. **Query IndexedDB** → Load from local storage via service
3. **Set Local State** → Component stores result in `useState`
4. **Render** → Component renders with the loaded data

### Data Initialization (First Launch)
1. App starts
2. Check IndexedDB for existing athlete record
3. If none → redirect to onboarding
4. If present → proceed to home

## Navigation & Routing

The app uses React Router with a flat routing strategy — all resources have top-level routes, no nesting.

```
/onboarding                Onboarding wizard (first launch only)
/                          Home — calendar view (sessions by date)
/sessions/new              Session create
/sessions/:id              Session detail
/sessions/:id/edit         Session edit
/workouts                  Workout library
/workouts/new              Workout create
/workouts/:id              Workout detail
/workouts/:id/edit         Workout edit
/thresholds                Thresholds
/training-zones            Training zones
/profile                   Athlete profile
```

The bottom navigation bar links to: Home (`/`), Workouts (`/workouts`), Profile (`/profile`).

## Service Worker
The app registers a custom service worker to enable full offline functionality.

- File location: `public/sw.js` (served from `/sw.js`)
- Registration: `main.tsx` on `window load` event
- Caching strategy: `index.html` is cached; all `navigate` requests fall back to the cached `index.html` when offline
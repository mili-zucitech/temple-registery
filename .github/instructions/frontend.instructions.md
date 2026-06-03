---
applyTo: "**/*.{ts,tsx}"
---

# Frontend Coding Standards — Temple Registry

## Directory Structure

```
src/
 ├── app/
 │    ├── store.ts               # Redux store configuration
 │    └── rootReducer.ts
 ├── components/                 # Shared, reusable presentational components
 ├── features/
 │    └── temple/                # One folder per domain feature
 │         ├── components/       # Feature-specific presentational components
 │         ├── pages/            # Page-level components (route targets)
 │         ├── templeApi.ts      # RTK Query API slice
 │         ├── templeSlice.ts    # Redux slice for UI-only state
 │         ├── templeHooks.ts    # Custom hooks that encapsulate all logic
 │         └── templeTypes.ts    # TypeScript interfaces and Zod schemas
 ├── hooks/                      # Generic shared hooks
 ├── layouts/                    # App shell, sidebar, header layouts
 ├── routes/                     # React Router route definitions
 └── services/                   # Non-RTK-Query utilities (e.g., interceptors)
```

Create a new feature folder (`features/<domain>/`) for every new domain. Never scatter feature files into generic folders.

---

## RTK Query — API Slices

- All server communication goes through RTK Query. Axios is a fallback only and must be explained with a comment.
- `credentials: 'include'` mandatory on `fetchBaseQuery` — required for httpOnly cookie auth.
- `baseUrl` must come from `import.meta.env.VITE_API_BASE_URL`. Never hardcode it.
- `providesTags` / `invalidatesTags` required on every endpoint for cache invalidation.
- Export typed hooks from the API slice. Never call `dispatch(api.endpoints.x.initiate(...))` directly in components.
- Define typed `useAppDispatch` and `useAppSelector` in `app/store.ts`. Never use untyped `useDispatch` / `useSelector`.

---

## JWT Token Storage

- JWT stored in an **httpOnly cookie** set exclusively by the backend (`Set-Cookie` header).
- Never store the token in `localStorage`, `sessionStorage`, Redux state, React state, or any JS-accessible variable.
- Never read, parse, or decode the JWT on the frontend.
- Logout must call the backend `/api/v1/auth/logout` endpoint — the backend clears the cookie server-side.
- On 401 responses, redirect to the login page using a `baseQueryWithReauth` wrapper in the RTK Query base query.

---

## Redux Slices — UI State Only

- Redux slices store **only** UI-controlling state (modal visibility, active tabs, filter selections). Never put server data in a Redux slice.

---

## Custom Hooks — All Logic Lives Here

- All business logic, API calls, and form submission handlers must live in custom hooks. Never inline them in components or pages.
- Hooks may call RTK Query hooks, Redux `dispatch`, and Zod validators.
- Every exported hook must have a corresponding test (see `testing.instructions.md`).

---

## Components — Presentational Only

- Props-driven. No RTK Query hooks inside components. Receive data as props from the page/hook.
- Internal state limited to controlled UI only (hover, focus, local toggle).
- Every data-displaying component must handle all three states: **loading**, **empty**, **error**.

---

## Pages — Compose Hooks and Components

- Pages are the only layer where hooks are called and data flows down to components.
- Must explicitly render loading, error, and empty states — never rely on a child component to handle them silently.

---

## shadcn/ui + Tailwind CSS Rules

- Use shadcn/ui components with Tailwind CSS exclusively. No MUI, Chakra UI, antd, or other CSS component libraries.
- **Tables:** must include `pagination`, `sortOrder`, and at minimum one filter column.
- **Forms:** use shadcn/ui `Form` with `FormField`/`FormItem` (React Hook Form + `zodResolver`) as the primary form solution. `useFieldArray` for dynamic field arrays.
- **Modals/Drawers:** use for create/edit flows. Inline editing is acceptable for simple single-field updates.
- **Feedback:** use `toast()` from Sonner / `useToast()` for user feedback. Never use browser `alert`.

---

## Zod Form Validation

- Every form schema defined with Zod in the feature's `*Types.ts` file.
- Zod schemas are the single source of truth — `z.infer<typeof schema>` produces the TypeScript type. Never define a separate interface and validator for the same shape.
- Connect Zod to shadcn/ui `Form` via `zodResolver` from `@hookform/resolvers/zod` passed to `useForm`.
- `PaginatedResponse<T>` and all shared API response shapes must be defined as TypeScript types in `templeTypes.ts` (or a shared `commonTypes.ts`).

---

## Error Handling

- A global `rtkQueryErrorLogger` middleware in `app/store.ts` handles all 4xx/5xx responses centrally using `isRejectedWithValue` from `@reduxjs/toolkit`. Type-guard `action.payload` as `FetchBaseQueryError` — never use `any`.
- Components must not individually handle API errors — receive the error state from the hook.
- `<ErrorBoundary>` must wrap the application root in `main.tsx` or `App.tsx`.
- All authenticated routes must be wrapped in a `<PrivateRoute>` component that checks auth state and redirects to `/login` when unauthenticated. Define route guards in `routes/` — never inline auth checks in page components.

---

## File Uploads

- Use shadcn/ui `Input type="file"` with `onChange` for client-side validation before any network request.
- Allowed types: `image/jpeg`, `image/png`, `application/pdf`. Maximum size: 5 MB. Reject and show `message.error` if either check fails.
- Use RTK Query mutation to POST to the upload endpoint. Never use `XMLHttpRequest` directly.

---

## Accessibility

- Every `FormItem` must have a `FormLabel` component.
- Every interactive element (`Button`, `Input`, etc.) must be keyboard-navigable (shadcn/ui components built on Radix UI handle this by default — do not override).
- Avoid disabling focus outlines (`outline: none` is prohibited).
- Provide descriptive `aria-label` on icon-only buttons.

---

## TypeScript

- `strict: true` is required in `tsconfig.json`.
- No `any` types. Use `unknown` + type guards when the shape is truly unknown.
- Prefer `type` for object shapes inferred from Zod schemas. Use `interface` for component props and extensible contracts.
- Never use non-null assertion (`!`) unless you've verified the value cannot be null/undefined via type guard above.

---

## Environment Variables

- All environment-specific values (API base URL, feature flags) in `.env.{mode}` files, accessed via `import.meta.env`.
- Prefix all Vite env vars with `VITE_`. Never access `process.env` directly in frontend code.
- Never commit `.env.production` with real values to version control.

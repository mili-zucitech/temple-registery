import { render, type RenderOptions } from '@testing-library/react'
import { configureStore } from '@reduxjs/toolkit'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import type { ReactElement, ReactNode } from 'react'
import { rootReducer } from '@/app/rootReducer'
import { authApi } from '@/features/auth/authApi'
import { declarationApi } from '@/features/declaration/declarationApi'
import { trustApi } from '@/features/trust/trustApi'
import { templeApi } from '@/features/temple/templeApi'
import { employeeApi } from '@/features/employee/employeeApi'

function buildTestStore(preloadedState?: any) {
  return configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(authApi.middleware, declarationApi.middleware, trustApi.middleware, templeApi.middleware, employeeApi.middleware),
  }) as any
}

interface WrapperOptions extends Omit<RenderOptions, 'wrapper'> {
  preloadedState?: any
  initialRoute?: string
}

function Wrapper({
  children,
  store,
  initialRoute,
}: {
  children: ReactNode
  store: any
  initialRoute: string
}) {
  return (
    <Provider store={store}>
      <MemoryRouter initialEntries={[initialRoute]}>
        {children}
      </MemoryRouter>
    </Provider>
  )
}

export function renderWithProviders(
  ui: ReactElement,
  { preloadedState, initialRoute = '/', ...renderOptions }: WrapperOptions = {}
) {
  const store = buildTestStore(preloadedState)
  return {
    ...render(ui, {
      wrapper: ({ children }) => (
        <Wrapper store={store} initialRoute={initialRoute}>{children}</Wrapper>
      ),
      ...renderOptions,
    }),
    store,
  }
}

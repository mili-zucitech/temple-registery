import { render, type RenderOptions } from '@testing-library/react'
import { configureStore } from '@reduxjs/toolkit'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import type { ReactElement, ReactNode } from 'react'
import { rootReducer } from '@/app/rootReducer'
import { authApi } from '@/features/auth/authApi'
import { declarationApi } from '@/features/declaration/declarationApi'

function buildTestStore(preloadedState?: Parameters<typeof configureStore>[0]['preloadedState']) {
  return configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(authApi.middleware, declarationApi.middleware),
  })
}

interface WrapperOptions extends Omit<RenderOptions, 'wrapper'> {
  preloadedState?: Parameters<typeof buildTestStore>[0]
  initialRoute?: string
}

function Wrapper({
  children,
  store,
  initialRoute,
}: {
  children: ReactNode
  store: ReturnType<typeof buildTestStore>
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

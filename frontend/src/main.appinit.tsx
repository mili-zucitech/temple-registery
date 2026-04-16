import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { Toaster } from 'sonner';
import { store } from './app/store';
import { AppRouter } from './routes';
import { useGetCurrentUserQuery } from '@/features/auth/authApi';

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

function AppInitGate({ children }: { children: React.ReactNode }) {
  // Wait for /auth/me to complete (token check + user fetch)
  const { data, isLoading, isError } = useGetCurrentUserQuery(undefined, { refetchOnMountOrArgChange: true });
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    if (!isLoading) setAppReady(true);
  }, [isLoading]);

  if (!appReady) return <LoadingScreen />;
  // Optionally: handle error state
  if (isError) return <div className="flex min-h-screen items-center justify-center text-destructive">Failed to load user session. Please refresh.</div>;
  return <>{children}</>;
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

createRoot(rootElement).render(
  <StrictMode>
    <Provider store={store}>
      <AppInitGate>
        <AppRouter />
        <Toaster richColors position="top-right" closeButton />
      </AppInitGate>
    </Provider>
  </StrictMode>
);

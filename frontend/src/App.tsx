import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppRouter } from './app/Router';
import { toast } from '@/stores/toast-store';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
    mutations: {
      onError: (error: unknown) => {
        const msg = error instanceof Error ? error.message : 'Something went wrong';
        toast(msg, 'error');
      },
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppRouter />
    </QueryClientProvider>
  );
}

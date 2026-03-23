import { useToastStore } from '@/stores/toast-store';
import { cn } from '@/lib/utils/utils';

export function Toaster() {
  const { toasts, remove } = useToastStore();

  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => remove(t.id)}
          className={cn(
            'pointer-events-auto flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg text-sm font-medium cursor-pointer transition-all',
            t.type === 'success' && 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/30 dark:border-green-800 dark:text-green-300',
            t.type === 'error' && 'bg-destructive/10 border-destructive/20 text-destructive',
            t.type === 'info' && 'bg-card border-border text-foreground',
          )}
        >
          <span>
            {t.type === 'success' && '✓ '}
            {t.type === 'error' && '✕ '}
            {t.message}
          </span>
        </div>
      ))}
    </div>
  );
}

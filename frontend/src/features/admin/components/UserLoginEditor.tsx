import { useState } from 'react';
import { useUpdateUser } from '../hooks/useAdmin';
import type { User, UserAdminUpdate } from '@/types/api';

const inputClass = 'w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring';

export function UserLoginEditor({ user, onDone }: { user: User; onDone: () => void }) {
  const updateUser = useUpdateUser();
  const [email, setEmail] = useState(user.email ?? '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const data: UserAdminUpdate = {};
    if (email.trim() !== (user.email ?? '')) data.email = email.trim();
    if (password) {
      if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
      if (password !== confirmPassword) { setError('Passwords do not match'); return; }
      data.password = password;
    }
    if (Object.keys(data).length === 0) { onDone(); return; }
    updateUser.mutate({ id: user.id, data }, { onSuccess: onDone });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-md border border-border bg-muted/40 p-3 space-y-3">
      <div className="space-y-1">
        <label htmlFor={`email-${user.id}`} className="text-xs font-medium text-muted-foreground">Email</label>
        <input
          id={`email-${user.id}`}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@example.com"
          className={inputClass}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor={`password-${user.id}`} className="text-xs font-medium text-muted-foreground">New password</label>
          <input
            id={`password-${user.id}`}
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Leave blank to keep current"
            className={inputClass}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor={`confirm-${user.id}`} className="text-xs font-medium text-muted-foreground">Confirm new password</label>
          <input
            id={`confirm-${user.id}`}
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={updateUser.isPending}
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {updateUser.isPending ? 'Saving…' : 'Save'}
        </button>
        <button type="button" onClick={onDone} className="rounded-md border border-input px-3 py-1.5 text-xs text-foreground hover:bg-accent">
          Cancel
        </button>
      </div>
    </form>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/lib/api/auth';
import { PageHeader } from '@/components/shared/PageHeader';

export function ChangePasswordPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (form.new_password !== form.confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await authApi.changePassword({
        current_password: form.current_password,
        new_password: form.new_password,
      });
      setSuccess(true);
      setTimeout(() => navigate('/'), 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to change password';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md">
      <PageHeader title="Change Password" />
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-800">
            Password changed successfully. Redirecting…
          </div>
        )}
        <div className="space-y-1">
          <label htmlFor="current_password" className="text-sm font-medium text-foreground">
            Current Password
          </label>
          <input
            id="current_password"
            name="current_password"
            type="password"
            required
            value={form.current_password}
            onChange={handleChange}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="new_password" className="text-sm font-medium text-foreground">
            New Password
          </label>
          <input
            id="new_password"
            name="new_password"
            type="password"
            required
            value={form.new_password}
            onChange={handleChange}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="confirm" className="text-sm font-medium text-foreground">
            Confirm New Password
          </label>
          <input
            id="confirm"
            name="confirm"
            type="password"
            required
            value={form.confirm}
            onChange={handleChange}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? 'Saving…' : 'Change Password'}
        </button>
      </form>
    </div>
  );
}

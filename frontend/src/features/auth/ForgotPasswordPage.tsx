import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '@/lib/api/auth';
import { apiErrorMessage } from '@/lib/utils/api';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.forgotPassword({ email });
      setSubmitted(true);
    } catch (err: unknown) {
      setError(apiErrorMessage(err, 'Request failed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Reset your password</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your email and we'll send you a link to reset.
          </p>
        </div>
        {submitted ? (
          <div className="rounded-md bg-muted border border-border p-4 text-sm text-foreground">
            <p className="font-medium">Check your inbox.</p>
            <p className="mt-1 text-muted-foreground">
              If that email is registered, a reset link is on its way. The link expires in 1 hour.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-1">
              <label htmlFor="email" className="text-sm font-medium text-foreground">Email</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        )}
        <p className="text-center text-sm text-muted-foreground">
          <Link to="/login" className="font-medium text-primary hover:underline">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}

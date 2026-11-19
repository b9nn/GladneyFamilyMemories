import { Link } from 'react-router-dom';

/** Shown in place of a page the current user hasn't been given access to yet. */
export function UnderConstruction({ title }: { title: string }) {
  return (
    <div>
      <h1 className="text-3xl font-bold text-foreground">{title}</h1>
      <div className="mt-8 rounded-lg border border-dashed border-border bg-card p-10 text-center">
        <p className="text-4xl" aria-hidden="true">🚧</p>
        <p className="mt-3 text-xl font-semibold text-foreground">Under construction</p>
        <p className="mt-2 text-sm text-muted-foreground">This page isn't ready for you yet. Check back soon.</p>
        <Link to="/" className="mt-6 inline-block text-sm font-medium text-primary hover:underline">
          Back to the dashboard
        </Link>
      </div>
    </div>
  );
}

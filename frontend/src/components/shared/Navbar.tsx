import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { useThemeStore } from '@/stores/theme-store';
import { cn } from '@/lib/utils/utils';

const navLinks = [
  { to: '/', label: 'Dashboard' },
  { to: '/vignettes', label: 'Vignettes' },
  { to: '/photos', label: 'Photos' },
  { to: '/audio', label: 'Audio' },
  { to: '/files', label: 'Files' },
  { to: '/family-tree', label: 'Family Tree' },
  { to: '/timeline', label: 'Timeline' },
  { to: '/search', label: 'Search' },
];

export function Navbar() {
  const { user, logout } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const location = useLocation();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  function toggleTheme() {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  }

  return (
    <nav className="border-b border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="text-lg font-bold text-foreground">
              Gladney Family
            </Link>
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cn(
                    'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    location.pathname === link.to
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded"
              title={`Theme: ${theme}`}
            >
              {theme === 'dark' ? '🌙' : theme === 'light' ? '☀️' : '⚙️'}
            </button>
            {user?.is_admin && (
              <Link
                to="/admin"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Admin
              </Link>
            )}
            <span className="text-sm text-muted-foreground">{user?.full_name ?? user?.username}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

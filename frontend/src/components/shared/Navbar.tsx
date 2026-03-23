import { useState } from 'react';
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
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  function toggleTheme() {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  }

  function closeMenu() { setMenuOpen(false); }

  const themeIcon = theme === 'dark' ? '🌙' : theme === 'light' ? '☀️' : '⚙️';

  return (
    <nav className="border-b border-border bg-background sticky top-0 z-40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="text-base font-bold text-foreground flex-shrink-0">
            Gladney Family
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-0.5 overflow-x-auto">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors',
                  location.pathname === link.to
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="text-sm text-muted-foreground hover:text-foreground px-2 py-1 rounded"
              title={`Theme: ${theme}`}
            >
              {themeIcon}
            </button>
            {user?.is_admin && (
              <Link to="/admin" className="hidden sm:block text-sm text-muted-foreground hover:text-foreground">
                Admin
              </Link>
            )}
            <span className="hidden sm:block text-sm text-muted-foreground truncate max-w-[120px]">
              {user?.full_name ?? user?.username}
            </span>
            <button
              onClick={handleLogout}
              className="hidden sm:block text-sm text-muted-foreground hover:text-foreground"
            >
              Logout
            </button>

            {/* Hamburger */}
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="lg:hidden flex flex-col gap-1 p-2 rounded hover:bg-accent"
              aria-label="Toggle menu"
            >
              <span className={cn('block w-5 h-0.5 bg-foreground transition-transform', menuOpen && 'translate-y-1.5 rotate-45')} />
              <span className={cn('block w-5 h-0.5 bg-foreground transition-opacity', menuOpen && 'opacity-0')} />
              <span className={cn('block w-5 h-0.5 bg-foreground transition-transform', menuOpen && '-translate-y-1.5 -rotate-45')} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden border-t border-border bg-background px-4 py-3 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={closeMenu}
              className={cn(
                'block px-3 py-2 rounded-md text-sm font-medium transition-colors',
                location.pathname === link.to
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              {link.label}
            </Link>
          ))}
          {user?.is_admin && (
            <Link
              to="/admin"
              onClick={closeMenu}
              className="block px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              Admin
            </Link>
          )}
          <div className="pt-2 border-t border-border flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{user?.full_name ?? user?.username}</span>
            <button
              onClick={() => { handleLogout(); closeMenu(); }}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

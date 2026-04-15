import { Link, useLocation } from 'react-router-dom'
import {
  BookOpen,
  Camera,
  Mic,
  FileText,
  Shield,
  LogOut,
  Menu,
  X,
  Home,
  TreePine,
  Clock,
  Search,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { CommandPalette } from '@/features/search/components/command-palette'
import { useAuthStore } from '@/features/auth/stores/auth-store'
import { cn } from '@/lib/utils'

const navLinks = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/vignettes', label: 'Vignettes', icon: BookOpen },
  { to: '/photos', label: 'Photos', icon: Camera },
  { to: '/audio', label: 'Audio', icon: Mic },
  { to: '/files', label: 'Files', icon: FileText },
  { to: '/family-tree', label: 'Family Tree', icon: TreePine },
  { to: '/timeline', label: 'Timeline', icon: Clock },
]

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [cmdkOpen, setCmdkOpen] = useState(false)

  // Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCmdkOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  if (!isAuthenticated) return null

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-lg">
            <TreePine className="h-5 w-5 text-primary" />
            <span className="hidden sm:inline">Gladney Family</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to}>
                <Button
                  variant={location.pathname === to ? 'secondary' : 'ghost'}
                  size="sm"
                  className="gap-1.5"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Button>
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <ThemeToggle />

            <Button variant="ghost" size="icon" onClick={() => setCmdkOpen(true)} aria-label="Search">
              <Search className="h-4 w-4" />
            </Button>

            {user?.is_admin && (
              <Link to="/admin">
                <Button
                  variant={location.pathname === '/admin' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="hidden md:flex gap-1.5"
                >
                  <Shield className="h-4 w-4" />
                  Admin
                </Button>
              </Link>
            )}

            <span className="hidden lg:inline text-sm text-muted-foreground">
              {user?.full_name || user?.username}
            </span>

            <Button variant="ghost" size="icon" onClick={logout} aria-label="Log out">
              <LogOut className="h-4 w-4" />
            </Button>

            {/* Mobile menu toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="md:hidden pb-4 pt-2 space-y-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
              >
                <Button
                  variant={location.pathname === to ? 'secondary' : 'ghost'}
                  className={cn("w-full justify-start gap-2")}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Button>
              </Link>
            ))}
            {user?.is_admin && (
              <Link to="/admin" onClick={() => setMobileOpen(false)}>
                <Button
                  variant={location.pathname === '/admin' ? 'secondary' : 'ghost'}
                  className="w-full justify-start gap-2"
                >
                  <Shield className="h-4 w-4" />
                  Admin
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
      <CommandPalette open={cmdkOpen} onOpenChange={setCmdkOpen} />
    </nav>
  )
}

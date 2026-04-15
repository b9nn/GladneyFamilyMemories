import { Navigate } from 'react-router-dom'
import { LoginForm } from './components/login-form'
import { useAuthStore } from './stores/auth-store'

export function LoginPage() {
  const { isAuthenticated } = useAuthStore()

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return <LoginForm />
}

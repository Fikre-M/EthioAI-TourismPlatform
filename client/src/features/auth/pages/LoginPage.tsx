import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { LoginForm } from '../components/LoginForm'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { useAuth } from '@hooks/useAuth'
import { ROUTES } from '@utils/constants'
import type { LoginFormData } from '../schemas/validation'

export const LoginPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { login, isAuthenticated, isLoading, error } = useAuth()

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated) {
      navigate(ROUTES.DASHBOARD)
    }
  }, [isAuthenticated, navigate])

  const handleLogin = async (data: LoginFormData) => {
    try {
      await login(data)
      navigate(ROUTES.DASHBOARD)
    } catch (err) {
      console.error('Login failed:', err)
      // Error is handled by the auth slice and displayed in the form
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-3xl font-bold">
              {t('auth.login.title', 'Sign In')}
            </CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm
              onSubmit={handleLogin}
              isLoading={isLoading}
              error={error}
            />
          </CardContent>
        </Card>

        <div className="mt-4 text-center">
          <Alert 
            variant="info" 
            title="Demo Credentials" 
            description="Email: demo@example.com | Password: Demo123!"
            className="text-left"
          />
        </div>
      </motion.div>
    </div>
  )
}

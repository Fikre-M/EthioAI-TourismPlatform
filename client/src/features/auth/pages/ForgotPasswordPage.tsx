import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { ForgotPasswordForm } from '../components/ForgotPasswordForm'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@components/common/Card/Card'
import { authService } from '@services/authService'
import { ROUTES } from '@utils/constants'
import type { ForgotPasswordFormData } from '../schemas/validation'

export const ForgotPasswordPage = () => {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleForgotPassword = async (data: ForgotPasswordFormData) => {
    try {
      setIsLoading(true)
      setError(null)
      await authService.forgotPassword(data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send reset email')
      throw err
    } finally {
      setIsLoading(false)
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
        {/* Back to Home Link */}
        <div className="mb-6 text-center">
          <Link
            to={ROUTES.HOME}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            {t('auth.backToHome', 'Back to Home')}
          </Link>
        </div>

        <Card>
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-3xl font-bold">
              Reset Password
            </CardTitle>
            <CardDescription>
              We'll send you instructions to reset your password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ForgotPasswordForm
              onSubmit={handleForgotPassword}
              isLoading={isLoading}
              error={error}
            />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

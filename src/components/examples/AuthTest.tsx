import { useState } from 'react'
import { useAuth } from '@hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'

export const AuthTest = () => {
  const { login, register, logout, user, isAuthenticated, isLoading, error } = useAuth()
  const [email, setEmail] = useState('demo@example.com')
  const [password, setPassword] = useState('Demo123!')
  const [name, setName] = useState('Test User')

  const handleLogin = async () => {
    try {
      await login({ email, password })
    } catch (err) {
      console.error('Login failed:', err)
    }
  }

  const handleRegister = async () => {
    try {
      await register({ 
        name, 
        email: 'newuser@example.com', 
        password, 
        confirmPassword: password 
      })
    } catch (err) {
      console.error('Registration failed:', err)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Authentication Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="error" title="Error" description={error} />
          )}

          {isAuthenticated ? (
            <div className="space-y-4">
              <Alert 
                variant="success" 
                title="Authenticated" 
                description={`Welcome, ${user?.name || user?.email}!`} 
              />
              
              <div className="p-3 bg-gray-50 rounded-md">
                <h4 className="font-medium mb-2">User Info:</h4>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(user, null, 2)}
                </pre>
              </div>

              <Button 
                onClick={handleLogout} 
                variant="secondary" 
                isLoading={isLoading}
                fullWidth
              >
                Logout
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="demo@example.com"
              />

              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Demo123!"
              />

              <Input
                label="Name (for registration)"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Test User"
              />

              <div className="flex gap-2">
                <Button 
                  onClick={handleLogin} 
                  variant="primary" 
                  isLoading={isLoading}
                  className="flex-1"
                >
                  Login
                </Button>

                <Button 
                  onClick={handleRegister} 
                  variant="secondary" 
                  isLoading={isLoading}
                  className="flex-1"
                >
                  Register
                </Button>
              </div>

              <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
                <strong>Demo Credentials:</strong><br />
                Email: demo@example.com<br />
                Password: Demo123!
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
import { setToken, setUser, clearAuth } from '@utils/storage'
import type { 
  LoginCredentials, 
  RegisterData, 
  ForgotPasswordData, 
  AuthResponse, 
  User 
} from '@features/auth/types/auth.types'

// Mock users database (in-memory)
const mockUsers: User[] = [
  {
    id: '1',
    email: 'demo@example.com',
    name: 'Demo User',
    emailVerified: true,
  }
]

// Mock password storage (in real app, this would be hashed and stored securely)
const mockPasswords: Record<string, string> = {
  'demo@example.com': 'Demo123!'
}

class MockAuthService {
  /**
   * Login user with email and password (mock)
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800))

    const { email, password } = credentials

    // Check if user exists
    const user = mockUsers.find(u => u.email === email)
    if (!user) {
      throw new Error('User not found')
    }

    // Check password
    if (mockPasswords[email] !== password) {
      throw new Error('Invalid password')
    }

    // Generate mock token
    const token = `mock-token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Store token and user data
    setToken(token)
    setUser(user)

    return {
      user,
      token,
    }
  }

  /**
   * Register new user (mock)
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    const { name, email, password } = data

    // Check if user already exists
    const existingUser = mockUsers.find(u => u.email === email)
    if (existingUser) {
      throw new Error('User with this email already exists')
    }

    // Create new user
    const newUser: User = {
      id: Date.now().toString(),
      email,
      name,
      emailVerified: true,
    }

    // Add to mock database
    mockUsers.push(newUser)
    mockPasswords[email] = password

    // Generate mock token
    const token = `mock-token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Store token and user data
    setToken(token)
    setUser(newUser)

    return {
      user: newUser,
      token,
    }
  }

  /**
   * Request password reset (mock)
   */
  async forgotPassword(data: ForgotPasswordData): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))

    const { email } = data

    // Check if user exists
    const user = mockUsers.find(u => u.email === email)
    if (!user) {
      throw new Error('User not found')
    }

    // In a real app, this would send an email
    console.log(`Password reset email sent to ${email}`)
  }

  /**
   * Get current user data (mock)
   */
  async getCurrentUser(): Promise<User> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300))

    const token = localStorage.getItem('auth_token')
    if (!token) {
      throw new Error('No token found')
    }

    // In a real app, we would verify the token
    const storedUser = localStorage.getItem('auth_user')
    if (!storedUser) {
      throw new Error('No user data found')
    }

    const user = JSON.parse(storedUser)
    
    // Update stored user data
    setUser(user)
    
    return user
  }

  /**
   * Logout user (mock)
   */
  async logout(): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200))

    // Clear local auth data
    clearAuth()
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem('auth_token')
    return !!token
  }
}

// Export singleton instance
export const mockAuthService = new MockAuthService()
export default mockAuthService
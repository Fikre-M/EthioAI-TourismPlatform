import { mockAuthService } from './mockAuthService'
import type { 
  LoginCredentials, 
  RegisterData, 
  ForgotPasswordData, 
  AuthResponse, 
  User 
} from '@features/auth/types/auth.types'

class AuthService {
  /**
   * Login user with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      return await mockAuthService.login(credentials)
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  /**
   * Register new user
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      return await mockAuthService.register(data)
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    }
  }

  /**
   * Request password reset
   */
  async forgotPassword(data: ForgotPasswordData): Promise<void> {
    try {
      await mockAuthService.forgotPassword(data)
    } catch (error) {
      console.error('Forgot password error:', error)
      throw error
    }
  }

  /**
   * Get current user data
   */
  async getCurrentUser(): Promise<User> {
    try {
      return await mockAuthService.getCurrentUser()
    } catch (error) {
      console.error('Get current user error:', error)
      throw error
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await mockAuthService.logout()
    } catch (error) {
      console.error('Logout error:', error)
      throw error
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return mockAuthService.isAuthenticated()
  }
}

// Export singleton instance
export const authService = new AuthService()
export default authService

import api from '@api/axios.config'
import { AUTH_ENDPOINTS } from '@api/endpoints'
import { setToken, setUser, clearAuth, getToken } from '@utils/storage'
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
      const response = await api.post<AuthResponse>(AUTH_ENDPOINTS.LOGIN, credentials)
      const { user, token } = response.data
      
      // Store token and user data
      setToken(token)
      setUser(user)
      
      return response.data
    } catch (error: any) {
      console.error('Login error:', error)
      throw new Error(error.response?.data?.message || 'Login failed. Please check your credentials.')
    }
  }

  /**
   * Register new user
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>(AUTH_ENDPOINTS.REGISTER, data)
      const { user, token } = response.data
      
      // Store token and user data
      setToken(token)
      setUser(user)
      
      return response.data
    } catch (error: any) {
      console.error('Registration error:', error)
      throw new Error(error.response?.data?.message || 'Registration failed. Please try again.')
    }
  }

  /**
   * Request password reset
   */
  async forgotPassword(data: ForgotPasswordData): Promise<void> {
    try {
      await api.post(AUTH_ENDPOINTS.FORGOT_PASSWORD, data)
    } catch (error: any) {
      console.error('Forgot password error:', error)
      throw new Error(error.response?.data?.message || 'Failed to process password reset request.')
    }
  }

  /**
   * Get current user data
   */
  async getCurrentUser(): Promise<User> {
    try {
      const response = await api.get<User>(AUTH_ENDPOINTS.ME)
      setUser(response.data) // Update stored user data
      return response.data
    } catch (error: any) {
      console.error('Get current user error:', error)
      // Clear auth data if the request fails (e.g., token expired)
      if (error.response?.status === 401) {
        clearAuth()
      }
      throw new Error(error.response?.data?.message || 'Failed to fetch user data.')
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      // Call the logout endpoint to invalidate the token on the server
      await api.post(AUTH_ENDPOINTS.LOGOUT)
    } catch (error) {
      console.error('Logout API error:', error)
      // Even if the API call fails, we still want to clear the local auth state
    } finally {
      // Clear local auth state regardless of API call success
      clearAuth()
    }
  }

  /**
   * Check if user is authenticated by checking for a valid token
   */
  isAuthenticated(): boolean {
    return !!getToken()
  }
}

// Export singleton instance
export const authService = new AuthService()
export default authService

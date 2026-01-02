import api from './api';
import { jwtDecode } from 'jwt-decode';

export interface LoginDto {
  email: string;
  motdepasse: string;
}

export interface RegisterDto {
  username: string;
  email: string;
  motdepasse: string;
  role_id?: number;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
}

export interface DecodedToken {
  sub: number;
  email: string;
  username?: string; // Add username to token interface
  roles?: string[]; // Array format (new format)
  permissions?: string[]; // Array of permission names
  role?: {         // Object format (from backend)
    id: number;
    name: string;
    description?: string;
  };
  role_id?: number;
  exp: number;
  iat: number;
}

export interface UserProfile {
  id: number;
  email: string;
  username: string;
  roles: string[];
  permissions: string[];
}

class AuthService {
  private readonly TOKEN_KEY = 'token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_KEY = 'user';

  /**
   * Check if token is valid and not expired
   */
  isTokenValid(token?: string): boolean {
    try {
      const tokenToCheck = token || this.getToken();
      if (!tokenToCheck) return false;

      const decoded = jwtDecode<DecodedToken>(tokenToCheck);
      const currentTime = Date.now() / 1000;

      // Check if token is expired (with 5 second buffer)
      return decoded.exp > currentTime - 5;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }

  /**
   * Get decoded token payload
   */
  getDecodedToken(token?: string): DecodedToken | null {
    try {
      const tokenToCheck = token || this.getToken();
      if (!tokenToCheck) return null;

      return jwtDecode<DecodedToken>(tokenToCheck);
    } catch (error) {
      console.error('Token decode error:', error);
      return null;
    }
  }

  /**
   * Get user profile from token
   */
  getUserProfile(): UserProfile | null {
    const decoded = this.getDecodedToken();
    if (!decoded) return null;

    // Extract roles from token - handle both formats
    let roles: string[] = [];

    if (decoded.roles && Array.isArray(decoded.roles)) {
      // New format: roles is already an array
      roles = decoded.roles;
    } else if (decoded.role && typeof decoded.role === 'object') {
      // Backend format: role is an object with name property
      roles = [decoded.role.name];
    } else if (decoded.role && typeof decoded.role === 'string') {
      // Fallback: role is a string
      roles = [decoded.role];
    }

    // Extract permissions from token
    const permissions: string[] = decoded.permissions && Array.isArray(decoded.permissions)
      ? decoded.permissions
      : [];

    return {
      id: decoded.sub,
      email: decoded.email,
      username: decoded.username || decoded.email, // Fallback to email if username is not in token
      roles: roles,
      permissions: permissions,
    };
  }

  /**
   * Login user
   */
  async login(credentials: LoginDto): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('/auth/login', credentials);
      const { access_token, refresh_token } = response.data;

      // Store tokens
      this.setToken(access_token);
      this.setRefreshToken(refresh_token);

      // Store user profile
      const userProfile = this.getUserProfile();
      if (userProfile) {
        localStorage.setItem(this.USER_KEY, JSON.stringify(userProfile));
      }

      // Dispatch event to notify auth context of change
      window.dispatchEvent(new Event('auth-changed'));

      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  }

  /**
   * Register new user
   */
  async register(data: RegisterDto): Promise<void> {
    try {
      await api.post('/auth/register', data);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear tokens and user data regardless of API call result
      this.clearAuth();
    }
  }

  /**
   * Get current user profile from localStorage
   */
  getCurrentUser(): UserProfile | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    try {
      const token = this.getToken();
      if (!token) {
        return false;
      }
      return this.isTokenValid(token);
    } catch (error) {
      console.error('Authentication check failed:', error);
      return false;
    }
  }

  /**
   * Get stored access token
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Get stored refresh token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Set access token
   */
  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  /**
   * Set refresh token
   */
  setRefreshToken(token: string): void {
    localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
  }

  /**
   * Clear all auth data
   */
  clearAuth(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);

    // Dispatch event to notify auth context of change
    window.dispatchEvent(new Event('auth-changed'));
  }

  /**
   * Check if user has a specific role
   */
  hasRole(role: string): boolean {
    const profile = this.getUserProfile();
    if (!profile) return false;
    return profile.roles.includes(role);
  }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(roles: string[]): boolean {
    const profile = this.getUserProfile();
    if (!profile) return false;
    return roles.some((role) => profile.roles.includes(role));
  }

  /**
   * Check if user has a specific permission
   */
  hasPermission(permission: string): boolean {
    const profile = this.getUserProfile();
    if (!profile || !profile.permissions) return false;
    return profile.permissions.includes(permission);
  }

  /**
   * Check if user has any of the specified permissions
   */
  hasAnyPermission(permissions: string[]): boolean {
    const profile = this.getUserProfile();
    if (!profile || !profile.permissions) return false;
    return permissions.some((permission) => profile.permissions.includes(permission));
  }

  /**
   * Check if user has all of the specified permissions
   */
  hasAllPermissions(permissions: string[]): boolean {
    const profile = this.getUserProfile();
    if (!profile || !profile.permissions) return false;
    return permissions.every((permission) => profile.permissions.includes(permission));
  }
}

export const authService = new AuthService();
export default authService;


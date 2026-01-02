import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService, { UserProfile } from '../services/auth.service';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserProfile | null;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  hasAllRoles: (roles: string[]) => boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  refreshAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider - Provides authentication context to the entire app
 * This ensures authentication state is shared and doesn't reset on navigation
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize state synchronously from localStorage to avoid flash
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      const token = authService.getToken();
      if (!token) return false;
      return authService.isTokenValid(token);
    } catch {
      return false;
    }
  });
  
  const [isLoading, setIsLoading] = useState(false); // Start as false since we initialize synchronously
  const [user, setUser] = useState<UserProfile | null>(() => {
    // Initialize user from current state
    try {
      const token = authService.getToken();
      if (token && authService.isTokenValid(token)) {
        return authService.getUserProfile();
      }
      return null;
    } catch {
      return null;
    }
  });

  const checkAuth = useCallback(() => {
    try {
      const token = authService.getToken();
      if (!token) {
        setIsAuthenticated(false);
        setUser(null);
        setIsLoading(false);
        return;
      }

      const authenticated = authService.isTokenValid(token);
      setIsAuthenticated(authenticated);

      if (authenticated) {
        const userProfile = authService.getUserProfile();
        console.log('AuthContext - User profile:', userProfile);
        console.log('AuthContext - User roles:', userProfile?.roles);
        setUser(userProfile);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Only do async check if we need to verify (not already initialized)
    // Since we initialize synchronously, we can skip the initial check
    // But we still want to set up listeners
    const needsCheck = !isAuthenticated || !user;
    if (needsCheck) {
      setIsLoading(true);
      checkAuth();
    }

    // Listen for storage changes (e.g., token updates)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token' || e.key === 'user') {
        console.log('AuthContext - Storage changed:', e.key);
        checkAuth();
      }
    };

    // Also listen for custom storage events (same-origin)
    const handleCustomStorageChange = () => {
      console.log('AuthContext - Auth changed event received');
      checkAuth();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth-changed', handleCustomStorageChange);

    // Check auth periodically (every 30 seconds) to catch token expiration
    const interval = setInterval(checkAuth, 30000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-changed', handleCustomStorageChange);
      clearInterval(interval);
    };
  }, [checkAuth]);

  const hasRole = useCallback((role: string): boolean => {
    if (!user || !user.roles || user.roles.length === 0) {
      return false;
    }
    const roleLower = role.toLowerCase();
    return user.roles.some(userRole => {
      const userRoleLower = userRole.toLowerCase();
      return userRoleLower === roleLower || userRoleLower.includes(roleLower);
    });
  }, [user]);

  const hasAnyRole = useCallback((roles: string[]): boolean => {
    if (!user || !user.roles || user.roles.length === 0) {
      return false;
    }
    const userRolesLower = user.roles.map(r => r.toLowerCase());
    return roles.some(role => {
      const roleLower = role.toLowerCase();
      return userRolesLower.some(userRole => 
        userRole === roleLower || userRole.includes(roleLower)
      );
    });
  }, [user]);

  const hasAllRoles = useCallback((roles: string[]): boolean => {
    if (!user || !user.roles || user.roles.length === 0) {
      return false;
    }
    const userRolesLower = user.roles.map(r => r.toLowerCase());
    return roles.every(role => {
      const roleLower = role.toLowerCase();
      return userRolesLower.some(userRole => 
        userRole === roleLower || userRole.includes(roleLower)
      );
    });
  }, [user]);

  const hasPermission = useCallback((permission: string): boolean => {
    if (!user || !user.permissions || user.permissions.length === 0) {
      return false;
    }
    const permissionLower = permission.toLowerCase();
    return user.permissions.some(userPermission => {
      const userPermissionLower = userPermission.toLowerCase();
      return userPermissionLower === permissionLower || userPermissionLower.includes(permissionLower);
    });
  }, [user]);

  const hasAnyPermission = useCallback((permissions: string[]): boolean => {
    if (!user || !user.permissions || user.permissions.length === 0) {
      return false;
    }
    const userPermissionsLower = user.permissions.map(p => p.toLowerCase());
    return permissions.some(permission => {
      const permissionLower = permission.toLowerCase();
      return userPermissionsLower.some(userPermission => 
        userPermission === permissionLower || userPermission.includes(permissionLower)
      );
    });
  }, [user]);

  const hasAllPermissions = useCallback((permissions: string[]): boolean => {
    if (!user || !user.permissions || user.permissions.length === 0) {
      return false;
    }
    const userPermissionsLower = user.permissions.map(p => p.toLowerCase());
    return permissions.every(permission => {
      const permissionLower = permission.toLowerCase();
      return userPermissionsLower.some(userPermission => 
        userPermission === permissionLower || userPermission.includes(permissionLower)
      );
    });
  }, [user]);

  const refreshAuth = useCallback(() => {
    checkAuth();
    // Dispatch custom event for same-origin listeners
    window.dispatchEvent(new Event('auth-changed'));
  }, [checkAuth]);

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    user,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    refreshAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook to use authentication context
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


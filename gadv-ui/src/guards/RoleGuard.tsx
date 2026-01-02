import React, { useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface RoleGuardProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  requireAll?: boolean; // If true, user must have ALL roles, otherwise ANY role
  fallbackPath?: string; // Path to redirect if user doesn't have required roles
}

/**
 * RoleGuard - Protects routes by checking user roles
 * Redirects to fallback path (default: /admin/dashboard) if user doesn't have required roles
 * 
 * Note: This should be used inside AuthGuard to ensure user is authenticated first
 */
const RoleGuard: React.FC<RoleGuardProps> = ({ 
  children, 
  requiredRoles = [], 
  requireAll = false,
  fallbackPath = '/admin/dashboard'
}) => {
  const { isAuthenticated, isLoading, user, hasAnyRole, hasAllRoles } = useAuth();

  // If no roles required, allow access immediately
  if (!requiredRoles || requiredRoles.length === 0) {
    return <>{children}</>;
  }

  // Show loading state while checking
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-400 via-cyan-500 to-teal-600">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Vérification des permissions...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, AuthGuard should handle this, but just in case
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has required roles
  const hasAccess = requireAll 
    ? hasAllRoles(requiredRoles)
    : hasAnyRole(requiredRoles);

  // Debug logging
  console.log('RoleGuard - Checking access:', {
    isAuthenticated,
    user,
    userRoles: user?.roles,
    requiredRoles,
    hasAccess,
    requireAll
  });

  // If user doesn't have access, redirect to fallback path
  if (!hasAccess) {
    console.log('RoleGuard - Access denied, redirecting to:', fallbackPath);
    return <Navigate to={fallbackPath} replace />;
  }

  // User has access, render children
  console.log('RoleGuard - Access granted');
  return <>{children}</>;
};

export default RoleGuard;


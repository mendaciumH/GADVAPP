import React, { useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface PermissionGuardProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
  requireAll?: boolean; // If true, user must have ALL permissions, otherwise ANY permission
  fallbackPath?: string; // Path to redirect if user doesn't have required permissions
}

/**
 * PermissionGuard - Protects routes by checking user permissions
 * Redirects to fallback path (default: /admin/dashboard) if user doesn't have required permissions
 * 
 * Note: This should be used inside AuthGuard to ensure user is authenticated first
 */
const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  requiredPermissions = [],
  requireAll = false,
  fallbackPath = '/admin/dashboard'
}) => {
  const { isAuthenticated, isLoading, user, hasAnyPermission, hasAllPermissions } = useAuth();

  // If no permissions required, allow access immediately
  if (!requiredPermissions || requiredPermissions.length === 0) {
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

  // Special case: Admin role bypasses permission checks (has all permissions)
  const isAdmin = user.roles?.some(role =>
    role.toLowerCase() === 'admin' || role.toLowerCase().includes('admin')
  );

  // Special case: Dashboard should be accessible to any authenticated user with at least one permission
  const isDashboardRoute = requiredPermissions.length === 1 && requiredPermissions[0] === 'view_dashboard';
  const userHasPermissions = user.permissions && user.permissions.length > 0;

  // Allow dashboard access if user has any permission (even without view_dashboard explicitly)
  if (isDashboardRoute && userHasPermissions && !isAdmin) {
    return <>{children}</>;
  }

  // Special case: If user has no permissions at all, show message
  const hasNoPermissions = !user.permissions || user.permissions.length === 0;
  if (hasNoPermissions && !isAdmin) {
    // If no permissions and trying to access dashboard, allow it (fallback)
    if (isDashboardRoute) {
      return <>{children}</>;
    }
    // Otherwise, show a message that permissions need to be assigned
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-10">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <h2 className="text-2xl font-bold text-gray-90 mb-4">Permissions Requises</h2>
          <p className="text-gray-70 mb-4">
            Votre compte n'a pas de permissions assignées. Veuillez contacter un administrateur pour obtenir les permissions nécessaires.
          </p>
          <p className="text-sm text-gray-60">
            Rôle: {user.roles?.join(', ') || 'Aucun'}
          </p>
        </div>
      </div>
    );
  }

  // Check if user has required permissions
  const hasAccess = isAdmin || (requireAll
    ? hasAllPermissions(requiredPermissions)
    : hasAnyPermission(requiredPermissions));

  // If user doesn't have access, handle redirect carefully to avoid loops
  if (!hasAccess) {
    // If trying to redirect to dashboard but user doesn't have view_dashboard, 
    // show message instead of creating redirect loop
    if (fallbackPath === '/admin/dashboard' && !hasAnyPermission(requiredPermissions) && !isDashboardRoute) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-10">
          <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
            <h2 className="text-2xl font-bold text-gray-90 mb-4">Accès Refusé</h2>
            <p className="text-gray-70 mb-4">
              Vous n'avez pas les permissions nécessaires pour accéder à cette page.
            </p>
            <p className="text-sm text-gray-60 mb-4">
              Permissions requises: {requiredPermissions.join(', ')}
            </p>
            <p className="text-sm text-gray-60">
              Vos permissions: {user.permissions?.join(', ') || 'Aucune'}
            </p>
            <p className="text-sm text-gray-60 mt-2">
              Rôle: {user.roles?.join(', ') || 'Aucun'}
            </p>
          </div>
        </div>
      );
    }

    return <Navigate to={fallbackPath} replace />;
  }

  // User has access, render children
  return <>{children}</>;
};

export default PermissionGuard;


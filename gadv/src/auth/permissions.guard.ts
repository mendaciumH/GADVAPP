import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { User } from 'src/entities/user.entity';

@Injectable()
export class PermissionsGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const requiredPermissions = this.reflector.getAllAndOverride<string[]>('permissions', [
            context.getHandler(),
            context.getClass(),
        ]);
        
        console.log('PermissionsGuard.canActivate - Checking permissions:', {
            requiredPermissions: requiredPermissions,
            hasRequiredPermissions: !!requiredPermissions && requiredPermissions.length > 0
        });
        
        if (!requiredPermissions || requiredPermissions.length === 0) {
            console.log('PermissionsGuard.canActivate - No permissions required, allowing access');
            return true;
        }
        
        const { user } = context.switchToHttp().getRequest();
        
        console.log('PermissionsGuard.canActivate - User from request:', {
            user: user ? {
                id: user.id,
                email: user.email,
                roles: user.roles,
                permissions: user.permissions
            } : null,
            userPermissions: user?.permissions || [],
            requiredPermissions: requiredPermissions
        });
        
        if (!user) {
            console.error('PermissionsGuard.canActivate - No user in request');
            return false;
        }
        
        // Special case: Admin role bypasses permission checks (has all permissions)
        const isAdmin = user.roles && Array.isArray(user.roles) && user.roles.some((role: string) => 
            role.toLowerCase() === 'admin' || role.toLowerCase().includes('admin')
        );
        
        if (isAdmin) {
            console.log('PermissionsGuard.canActivate - Admin user detected, bypassing permission check');
            return true;
        }
        
        if (!user.permissions || !Array.isArray(user.permissions) || user.permissions.length === 0) {
            console.error('PermissionsGuard.canActivate - User has no permissions:', user);
            return false;
        }
        
        // Check if user has at least one of the required permissions
        const hasAccess = requiredPermissions.some((permission) => 
            user.permissions.includes(permission)
        );
        
        console.log('PermissionsGuard.canActivate - Access result:', {
            hasAccess: hasAccess,
            userPermissions: user.permissions,
            requiredPermissions: requiredPermissions
        });
        
        return hasAccess;
    }
}


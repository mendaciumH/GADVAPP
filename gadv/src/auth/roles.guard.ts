import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { User } from 'src/entities/user.entity';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
            context.getHandler(),
            context.getClass(),
        ]);
        
        console.log('RolesGuard.canActivate - Checking roles:', {
            requiredRoles: requiredRoles,
            hasRequiredRoles: !!requiredRoles && requiredRoles.length > 0
        });
        
        if (!requiredRoles) {
            console.log('RolesGuard.canActivate - No roles required, allowing access');
            return true;
        }
        
        const { user } = context.switchToHttp().getRequest();
        
        console.log('RolesGuard.canActivate - User from request:', {
            user: user ? {
                id: user.id,
                email: user.email,
                roles: user.roles
            } : null,
            userRoles: user?.roles || [],
            requiredRoles: requiredRoles
        });
        
        if (!user) {
            console.error('RolesGuard.canActivate - No user in request');
            return false;
        }
        
        if (!user.roles || !Array.isArray(user.roles) || user.roles.length === 0) {
            console.error('RolesGuard.canActivate - User has no roles:', user);
            return false;
        }
        
        const hasAccess = requiredRoles.some((role) => user.roles.includes(role));
        
        console.log('RolesGuard.canActivate - Access result:', {
            hasAccess: hasAccess,
            userRoles: user.roles,
            requiredRoles: requiredRoles
        });
        
        return hasAccess;
    }
}

async function getUser(context: ExecutionContext): Promise<User> {
    const request = context.switchToHttp().getRequest();
    return request.user;
}

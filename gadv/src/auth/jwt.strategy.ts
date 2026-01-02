import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { JWT_CONFIG } from './jwt.config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        console.log('JwtStrategy - Initializing with secret:', {
            hasEnvSecret: !!process.env.JWT_SECRET,
            secretLength: JWT_CONFIG.secret.length,
            secretPreview: JWT_CONFIG.secret.substring(0, 10) + '...',
            secretMatch: JWT_CONFIG.secret === (process.env.JWT_SECRET || 'your-secret-key-change-in-production')
        });
        
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: JWT_CONFIG.secret,
        });
    }

    async validate(payload: any) {
        console.log('JwtStrategy.validate - Payload received:', {
            sub: payload.sub,
            email: payload.email,
            roles: payload.roles,
            permissions: payload.permissions,
            role: payload.role,
            role_id: payload.role_id,
            exp: payload.exp,
            iat: payload.iat
        });
        
        // Validate payload structure
        if (!payload.sub || !payload.email) {
            console.error('JwtStrategy.validate - Invalid payload: missing sub or email');
            return null;
        }
        
        // Extract roles from payload - handle both formats
        let roles: string[] = [];
        if (payload.roles && Array.isArray(payload.roles)) {
            roles = payload.roles;
        } else if (payload.role && typeof payload.role === 'object' && payload.role.name) {
            roles = [payload.role.name];
        } else if (payload.role && typeof payload.role === 'string') {
            roles = [payload.role];
        }
        
        // Extract permissions from payload
        const permissions: string[] = payload.permissions && Array.isArray(payload.permissions) 
            ? payload.permissions 
            : [];
        
        console.log('JwtStrategy.validate - Returning user:', {
            id: payload.sub,
            email: payload.email,
            roles: roles,
            permissions: permissions
        });
        
        return { 
            id: payload.sub, 
            email: payload.email, 
            roles: roles,
            permissions: permissions
        };
    }
}


import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    
    console.log('JwtAuthGuard.canActivate - Request received:', {
      url: request.url,
      method: request.method,
      hasAuthHeader: !!authHeader,
      authHeaderPreview: authHeader ? authHeader.substring(0, 30) + '...' : 'none'
    });
    
    if (!authHeader) {
      console.error('JwtAuthGuard.canActivate - No authorization header');
      throw new UnauthorizedException('No authorization header found');
    }
    
    if (!authHeader.startsWith('Bearer ')) {
      console.error('JwtAuthGuard.canActivate - Invalid header format:', authHeader.substring(0, 20));
      throw new UnauthorizedException('Invalid authorization header format');
    }
    
    return super.canActivate(context);
  }
  
  handleRequest(err: any, user: any, info: any) {
    console.log('JwtAuthGuard.handleRequest - Called with:', {
      hasError: !!err,
      error: err ? err.message : null,
      hasUser: !!user,
      user: user ? { id: user.id, email: user.email, roles: user.roles } : null,
      info: info ? info.message : null
    });
    
    if (err) {
      console.error('JwtAuthGuard.handleRequest - Error occurred:', err);
      throw err;
    }
    
    if (!user) {
      console.error('JwtAuthGuard.handleRequest - No user returned from JwtStrategy');
      throw new UnauthorizedException('Authentication failed - no user returned');
    }
    
    console.log('JwtAuthGuard.handleRequest - Authentication successful:', {
      userId: user.id,
      email: user.email,
      roles: user.roles
    });
    
    return user;
  }
} 
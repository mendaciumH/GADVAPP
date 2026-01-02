import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '../entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private jwtService: JwtService,
        private configService: ConfigService,
    ) { }

    async validateUser(email: string, motdepasse: string): Promise<any> {
        try {
            const user = await this.userRepository.findOne({
                where: { email },
                relations: ['role', 'role.permissions']
            });

            if (!user) {
                console.log(`User not found with email: ${email}`);
                return null;
            }

            // Log user role information
            console.log(`User found: ${email}`, {
                id: user.id,
                role_id: user.role_id,
                role: user.role ? {
                    id: user.role.id,
                    name: user.role.name,
                    permissions: user.role.permissions?.map(p => p.name) || []
                } : null
            });

            const isPasswordValid = await bcrypt.compare(motdepasse, user.motdepasse);
            if (!isPasswordValid) {
                console.log(`Invalid password for email: ${email}`);
                return null;
            }

            // Remove password from result
            const { motdepasse: _, ...result } = user;
            return result;
        } catch (error) {
            console.error(`Error validating user ${email}:`, error);
            return null;
        }
    }

    async login(user: any) {
        // User has a single role (ManyToOne relationship), not an array
        const roles = user.role ? [user.role.name] : [];

        // Extract permissions from role
        const permissions = user.role?.permissions?.map((p: any) => p.name) || [];

        // Log user data for debugging
        console.log('AuthService.login - User data:', {
            id: user.id,
            email: user.email,
            role_id: user.role_id,
            role: user.role ? {
                id: user.role.id,
                name: user.role.name
            } : null,
            roles: roles,
            permissions: permissions
        });

        if (!user.id || !user.email) {
            throw new UnauthorizedException('Invalid user data');
        }


        const payload = {
            email: user.email,
            username: user.username,
            sub: user.id,
            roles,  // Array of role names
            permissions,  // Array of permission names
            role_id: user.role_id || null
        };

        console.log('AuthService.login - JWT Payload:', payload);
        console.log('AuthService.login - JWT Secret check:', {
            hasEnvSecret: !!process.env.JWT_SECRET,
            secretLength: this.jwtService['moduleRef'] ? 'Using JWT module secret' : 'Unknown',
            payloadKeys: Object.keys(payload)
        });

        const access_token = this.jwtService.sign(payload);
        const refresh_token = this.jwtService.sign(payload, { expiresIn: '7d' });

        console.log('AuthService.login - Token created:', {
            accessTokenLength: access_token.length,
            refreshTokenLength: refresh_token.length,
            accessTokenPreview: access_token.substring(0, 50) + '...'
        });

        return {
            access_token: access_token,
            refresh_token: refresh_token
        };
    }

    async register(username: string, email: string, motdepasse: string, role_id?: number) {
        const hashedPassword = await bcrypt.hash(motdepasse, 12);
        const user = this.userRepository.create({ username, email, motdepasse: hashedPassword, role_id });
        return this.userRepository.save(user);
    }

    async logout(user: any): Promise<{ message: string }> {
        return { message: 'Logged out successfully' };
    }
}



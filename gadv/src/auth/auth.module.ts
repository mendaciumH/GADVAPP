import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import { Permission } from '../entities/permission.entity';
import { AuthService } from './auth.service';
import { ConfigModule } from '@nestjs/config';
import {LocalStrategy} from './local.strategy';
import {JwtStrategy} from './jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthController } from './auth.controller';
import { RolesGuard } from './roles.guard';
import { PermissionsGuard } from './permissions.guard';
import { JWT_CONFIG } from './jwt.config';

@Module({
    imports: [
        TypeOrmModule.forFeature([User]),PassportModule,
        JwtModule.register({
            secret: JWT_CONFIG.secret,
            signOptions: { expiresIn: JWT_CONFIG.expiresIn },
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, LocalStrategy, JwtStrategy, RolesGuard, PermissionsGuard],
    exports: [AuthService, PermissionsGuard],
})
export class AuthModule {}
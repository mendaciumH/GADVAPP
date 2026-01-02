import { Controller, Post, Body, UnauthorizedException ,Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';


@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}


    @Post('login')
    @UseGuards(LocalAuthGuard)
    async login(@Body() loginDto: LoginDto, @Request() req: any) {
        try {
            return this.authService.login(req.user);
        } catch (error) {
            throw new UnauthorizedException('Invalid credentials');
        }
    }

    @Post('register')
    async register(@Body() body:{username: string, email: string, motdepasse: string, role_id?: number}) {
        return this.authService.register(body.username, body.email, body.motdepasse, body.role_id);
    }

    @Post('logout')
    @UseGuards(JwtAuthGuard)
    async logout(@Request() req: any) {
        return this.authService.logout(req.user);


    }

    @UseGuards(JwtAuthGuard)
    @Post('profile')
    getProfile(@Request() req: any) {
        return req.user;
    }

}


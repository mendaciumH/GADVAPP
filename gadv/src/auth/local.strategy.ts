import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from 'src/entities/user.entity';



@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
    constructor(private authService: AuthService) {
        super({
            usernameField: 'email',
            passwordField: 'motdepasse',
        });
    }



async validate(email: string, motdepasse: string): Promise<User> {
    const user = await this.authService.validateUser(email, motdepasse);
    if (!user) {
        throw new UnauthorizedException('Invalid credentials');
    }
    return user;
}

}



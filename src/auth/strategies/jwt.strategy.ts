import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { UserService } from '../../user/user.service.js';
import { AuthenticatedUser } from '../types/authenticated-user.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        configService: ConfigService,
        private readonly userService: UserService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.getOrThrow<string>(
                'jwt.accessSecret',
            ),
        });
    }

    async validate(payload: {
        sub: string;
        email: string;
        role: string;
    }): Promise<AuthenticatedUser | boolean> {
        const user = await this.userService.findById(payload.sub);

        if (!user) {
            return false;
        }

        return {
            id: user._id.toString(),
            email: user.email,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
        };
    }
}
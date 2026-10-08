import { Injectable, UnauthorizedException } from '@nestjs/common';

import { UserService } from '../user/user.service.js';
import { PasswordService } from './password.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { JwtService } from '@nestjs/jwt';
import { RefreshTokenService } from '../refresh-token/refresh-token.service.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService,
        private readonly passwordService: PasswordService,
        private readonly jwtService: JwtService,
        private readonly refreshTokenService: RefreshTokenService,
    ) { }

    async register(dto: RegisterDto) {
        const passwordHash = await this.passwordService.hash(
            dto.password,
        );

        const user = await this.userService.createUser({
            email: dto.email,
            passwordHash,
        });

        return {
            id: user._id,
            email: user.email,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
            createdAt: user.createdAt,
        };
    }

    async login(dto: LoginDto) {
        const user = await this.userService.findByEmail(dto.email);

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isPasswordValid = await this.passwordService.verify(
            user.passwordHash,
            dto.password,
        );

        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const accessToken = await this.jwtService.signAsync({
            sub: user._id.toString(),
            email: user.email,
            role: user.role,
        });

        const refreshToken =
            await this.refreshTokenService.create(
                user._id.toString(),
            );

        return {
            accessToken,
            refreshToken: refreshToken.token,
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                isEmailVerified: user.isEmailVerified,
            },
        };
    }

    async refresh(dto: RefreshTokenDto) {
        const rotatedToken =
            await this.refreshTokenService.rotateToken(
                dto.refreshToken,
            );

        const user = await this.userService.findById(
            rotatedToken.userId,
        );

        if (!user) {
            throw new UnauthorizedException(
                'Invalid refresh token',
            );
        }

        const accessToken = await this.jwtService.signAsync({
            sub: user._id.toString(),
            email: user.email,
            role: user.role,
        });

        return {
            accessToken,
            refreshToken: rotatedToken.token,
        };
    }


}
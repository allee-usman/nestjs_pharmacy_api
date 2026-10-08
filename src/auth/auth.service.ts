import { Injectable, UnauthorizedException } from '@nestjs/common';

import { UserService } from '../user/user.service.js';
import { PasswordService } from './password.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { JwtService } from '@nestjs/jwt';
import { RefreshTokenService } from '../refresh-token/refresh-token.service.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import mongoose from 'mongoose';
import { InjectConnection } from '@nestjs/mongoose';
import { LogoutDto } from './dto/logout.dto.js';

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService,
        private readonly passwordService: PasswordService,
        private readonly jwtService: JwtService,
        private readonly refreshTokenService: RefreshTokenService,

        @InjectConnection() 
        private readonly connection: mongoose.Connection,
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
        const session =
            await this.connection.startSession();

        try {
            let result: {
                accessToken: string;
                refreshToken: string;
            };

            await session.withTransaction(async () => {
                const storedToken =
                    await this.refreshTokenService.findByToken(
                        dto.refreshToken,
                        session,
                    );

                if (!storedToken) {
                    throw new UnauthorizedException(
                        'Invalid refresh token',
                    );
                }

                if (storedToken.revoked) {
                    await this.refreshTokenService.revokeFamily(
                        storedToken.familyId,
                    );

                    throw new UnauthorizedException(
                        'Refresh token reuse detected',
                    );
                }

                if (storedToken.expiresAt <= new Date()) {
                    throw new UnauthorizedException(
                        'Refresh token has expired',
                    );
                }

                const user = await this.userService.findById(
                    storedToken.userId.toString(),
                    session,
                );

                if (!user) {
                    throw new UnauthorizedException(
                        'Invalid refresh token',
                    );
                }

                const newRefreshToken =
                    await this.refreshTokenService.createWithSession(
                        user._id.toString(),
                        storedToken.familyId,
                        session,
                    );

                const rotationSucceeded =
                    await this.refreshTokenService.revokeWithSession(
                        storedToken,
                        newRefreshToken.id,
                        session,
                    );

                if (!rotationSucceeded) {
                    throw new UnauthorizedException(
                        'Refresh token reuse detected',
                    );
                }

                const accessToken =
                    await this.jwtService.signAsync({
                        sub: user._id.toString(),
                        email: user.email,
                        role: user.role,
                    });

                result = {
                    accessToken,
                    refreshToken: newRefreshToken.token,
                };
            });

            return result!;
        } finally {
            await session.endSession();
        }
    }

    async logout(dto: LogoutDto) {
        const storedToken =
            await this.refreshTokenService.findByToken(
                dto.refreshToken,
            );

        if (!storedToken) {
            throw new UnauthorizedException(
                'Invalid refresh token',
            );
        }

        await this.refreshTokenService.revokeFamily(
            storedToken.familyId,
        );

        return {
            message: 'Logged out successfully',
        };
    }
}
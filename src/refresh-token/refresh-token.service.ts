
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model } from 'mongoose';
import { createHash, randomBytes } from 'node:crypto';
import mongoose from 'mongoose';

import {
    RefreshToken,
    RefreshTokenDocument,
} from './schemas/refresh-token.schema.js';

@Injectable()
export class RefreshTokenService {
    constructor(
        @InjectModel(RefreshToken.name)
        private readonly refreshTokenModel: Model<RefreshTokenDocument>,

        @InjectConnection()
        private readonly connection: mongoose.Connection,
    ) { }

    generateToken(): string {
        return randomBytes(64).toString('hex');
    }

    hashToken(token: string): string {
        return createHash('sha256')
            .update(token)
            .digest('hex');
    }

    generateFamilyId(): string {
        return randomBytes(32).toString('hex');
    }

    async create(
        userId: string,
        familyId?: string,
    ): Promise<{
        token: string;
        tokenHash: string;
        expiresAt: Date;
        id: string;
        familyId: string;
    }> {
        const token = this.generateToken();
        const tokenHash = this.hashToken(token);
        const tokenFamilyId = familyId ?? this.generateFamilyId();

        const expiresAt = new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000,
        );

        const refreshToken = await this.refreshTokenModel.create({
            userId,
            tokenHash,
            familyId: tokenFamilyId,
            expiresAt,
        });

        return {
            token,
            tokenHash,
            expiresAt,
            id: refreshToken._id.toString(),
            familyId: tokenFamilyId,
        };
    }

    async findByToken(
        token: string,
        session?: ClientSession,
    ): Promise<RefreshTokenDocument | null> {
        const tokenHash = this.hashToken(token);

        const query = this.refreshTokenModel.findOne({
            tokenHash,
        });

        if (session) {
            query.session(session);
        }

        return query.exec();
    }

    async rotateToken(
        rawToken: string,
    ): Promise<{
        token: string;
        id: string;
        familyId: string;
        userId: string;
    }> {
        const tokenHash = this.hashToken(rawToken);

        return this.connection.transaction(async (session) => {
            const storedToken =
                await this.refreshTokenModel
                    .findOne({
                        tokenHash,
                    })
                    .session(session);

            if (!storedToken) {
                throw new UnauthorizedException(
                    'Invalid refresh token',
                );
            }

            if (storedToken.revoked) {
                throw new UnauthorizedException(
                    'Refresh token reuse detected',
                );
            }

            if (storedToken.expiresAt <= new Date()) {
                throw new UnauthorizedException(
                    'Refresh token has expired',
                );
            }

            const newToken = this.generateToken();
            const newTokenHash = this.hashToken(newToken);

            const expiresAt = new Date(
                Date.now() + 30 * 24 * 60 * 60 * 1000,
            );

            const [createdToken] =
                await this.refreshTokenModel.create(
                    [
                        {
                            userId: storedToken.userId,
                            tokenHash: newTokenHash,
                            familyId: storedToken.familyId,
                            expiresAt,
                        },
                    ],
                    { session },
                );

            const updatedToken =
                await this.refreshTokenModel.findOneAndUpdate(
                    {
                        _id: storedToken._id,
                        revoked: false,
                    },
                    {
                        $set: {
                            revoked: true,
                            revokedAt: new Date(),
                            replacedByTokenId:
                                createdToken._id.toString(),
                        },
                    },
                    {
                        new: true,
                        session,
                    },
                );

            if (!updatedToken) {
                throw new UnauthorizedException(
                    'Refresh token reuse detected',
                );
            }

            return {
                token: newToken,
                id: createdToken._id.toString(),
                familyId: createdToken.familyId,
                userId: storedToken.userId.toString(),
            };
        });
    }

    async revokeFamily(
        familyId: string,
        session?: ClientSession,
    ): Promise<void> {
        await this.refreshTokenModel.updateMany(
            {
                familyId,
                revoked: false,
            },
            {
                $set: {
                    revoked: true,
                    revokedAt: new Date(),
                },
            },
            session ? { session } : undefined,
        );
    }

    async createWithSession(
        userId: string,
        familyId: string,
        session: ClientSession,
    ): Promise<{
        token: string;
        tokenHash: string;
        expiresAt: Date;
        id: string;
        familyId: string;
    }> {
        const token = this.generateToken();
        const tokenHash = this.hashToken(token);

        const expiresAt = new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000,
        );

        const [refreshToken] =
            await this.refreshTokenModel.create(
                [
                    {
                        userId,
                        tokenHash,
                        familyId,
                        expiresAt,
                    },
                ],
                { session },
            );

        return {
            token,
            tokenHash,
            expiresAt,
            id: refreshToken._id.toString(),
            familyId,
        };
    }

    async revokeWithSession(
        token: RefreshTokenDocument,
        replacementId: string,
        session: ClientSession,
    ): Promise<boolean> {
        const result =
            await this.refreshTokenModel.updateOne(
                {
                    _id: token._id,
                    revoked: false,
                },
                {
                    $set: {
                        revoked: true,
                        revokedAt: new Date(),
                        replacedByTokenId: replacementId,
                    },
                },
                { session },
            );

        return result.modifiedCount === 1;
    }
}
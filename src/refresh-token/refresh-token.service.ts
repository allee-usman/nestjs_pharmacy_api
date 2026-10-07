
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { createHash, randomBytes } from 'node:crypto';

import {
    RefreshToken,
    RefreshTokenDocument,
} from './schemas/refresh-token.schema.js';

@Injectable()
export class RefreshTokenService {
    constructor(
        @InjectModel(RefreshToken.name)
        private readonly refreshTokenModel: Model<RefreshTokenDocument>,
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

    async findByToken(token: string): Promise<RefreshTokenDocument | null> {
        const tokenHash = this.hashToken(token);

        return this.refreshTokenModel
            .findOne({ tokenHash })
            .exec();
    }

    async rotate(
        token: RefreshTokenDocument,
    ): Promise<void> {
        token.revoked = true;
        token.revokedAt = new Date();

        await token.save();
    }

    async revokeFamily(familyId: string): Promise<void> {
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
        );
    }
}
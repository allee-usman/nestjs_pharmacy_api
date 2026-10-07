
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

    async create(
        userId: string,
    ): Promise<{
        token: string;
        tokenHash: string;
        expiresAt: Date;
    }> {
        const token = this.generateToken();
        const tokenHash = this.hashToken(token);

        const expiresAt = new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000,
        );

        await this.refreshTokenModel.create({
            userId,
            tokenHash,
            expiresAt,
        });

        return {
            token,
            tokenHash,
            expiresAt,
        };
    }
}
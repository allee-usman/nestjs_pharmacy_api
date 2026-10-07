import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { describe, beforeAll, afterAll, expect, it } from 'vitest';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { AppModule } from '../src/app.module.js';
import { RefreshToken, RefreshTokenDocument } from '../src/refresh-token/schemas/refresh-token.schema.js';
import { createHash } from 'node:crypto';

describe('Auth (e2e)', () => {
    let app: INestApplication;
    let refreshTokenModel: Model<RefreshTokenDocument>;

    beforeAll(async () => {
        const moduleFixture: TestingModule =
            await Test.createTestingModule({
                imports: [AppModule],
            }).compile();

        app = moduleFixture.createNestApplication();

        app.useGlobalPipes(
            new ValidationPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true,
            }),
        );

        await app.init();

        refreshTokenModel = moduleFixture.get<
            Model<RefreshTokenDocument>
        >(
            getModelToken(RefreshToken.name),
        );
    });

    afterAll(async () => {
        await app.close();
    });

    it('should login successfully', async () => {
        const response = await request(app.getHttpServer())
            .post('/auth/login')
            .send({
                email: 'ali.usman@example.com',
                password: 'password123',
            })
            .expect(200);

        expect(response.body.accessToken).toBeDefined();
        expect(response.body.refreshToken).toBeDefined();

        expect(response.body.user).toEqual(
            expect.objectContaining({
                email: 'ali.usman@example.com',
                role: 'user',
            }),
        );
    });

    it('should refresh and rotate the refresh token', async () => {
        const loginResponse = await request(app.getHttpServer())
            .post('/auth/login')
            .send({
                email: 'ali.usman@example.com',
                password: 'password123',
            })
            .expect(200);

        const oldRefreshToken =
            loginResponse.body.refreshToken;

        expect(oldRefreshToken).toBeDefined();

        const refreshResponse = await request(app.getHttpServer())
            .post('/auth/refresh')
            .send({
                refreshToken: oldRefreshToken,
            })
            .expect(200);

        const newRefreshToken =
            refreshResponse.body.refreshToken;

        expect(refreshResponse.body.accessToken).toBeDefined();
        expect(newRefreshToken).toBeDefined();

        expect(newRefreshToken).not.toBe(oldRefreshToken);

        const oldTokenHash = createHash('sha256')
            .update(oldRefreshToken)
            .digest('hex');

        const newTokenHash = createHash('sha256')
            .update(newRefreshToken)
            .digest('hex');

        const oldTokenRecord =
            await refreshTokenModel.findOne({
                tokenHash: oldTokenHash,
            });

        const newTokenRecord =
            await refreshTokenModel.findOne({
                tokenHash: newTokenHash,
            });

        expect(oldTokenRecord).not.toBeNull();
        expect(newTokenRecord).not.toBeNull();

        expect(oldTokenRecord!.revoked).toBe(true);
        expect(oldTokenRecord!.revokedAt).not.toBeNull();

        expect(oldTokenRecord!.replacedByTokenId).toBe(
            newTokenRecord!._id.toString(),
        );

        expect(newTokenRecord!.revoked).toBe(false);

        expect(newTokenRecord!.familyId).toBe(
            oldTokenRecord!.familyId,
        );
    });
});
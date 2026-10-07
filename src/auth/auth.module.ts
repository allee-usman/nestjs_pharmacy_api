import { Module } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { UserModule } from '../user/user.module.js';
import { PasswordService } from './password.service.js';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { MongooseModule } from '@nestjs/mongoose';
import { RefreshToken, RefreshTokenSchema } from '../refresh-token/schemas/refresh-token.schema.js';
import { RefreshTokenService } from '../refresh-token/refresh-token.service.js';

@Module({
  imports: [
    UserModule,

    MongooseModule.forFeature([
      {
        name: RefreshToken.name,
        schema: RefreshTokenSchema,
      },
    ]),

    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_ACCESS_EXPIRES_IN') as any,
        },
      }),
    }),
  ], // Import UserModule to use UserService in AuthService
  providers: [AuthService, PasswordService, JwtStrategy, RefreshTokenService],
  controllers: [AuthController]
})
export class AuthModule {}

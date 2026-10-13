
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { UserService } from './user.service.js';
import { UserController } from './user.controller.js';

import { User, UserSchema } from './schemas/user.schema.js';
import { PasswordService } from '../auth/password.service.js';
import { RefreshTokenModule } from '../refresh-token/refresh-token.module.js';

@Module({
  imports: [
    RefreshTokenModule,
    MongooseModule.forFeature([ // we're telling Nest: "The User model belongs to this module."
      {
        name: User.name,
        schema: UserSchema,
      },
    ])
  ],

  providers: [UserService, PasswordService],

  controllers: [UserController],

  exports: [UserService], // this makes it available for other modules to use i.e AuthModule
})
export class UserModule { }
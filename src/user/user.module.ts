
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { UserService } from './user.service.js';
import { UserController } from './user.controller.js';

import { User, UserSchema } from './schemas/user.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([ // we're telling Nest: "The User model belongs to this module."
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),
  ],

  providers: [UserService],

  controllers: [UserController],

  exports: [UserService], // this makes it available for other modules to use i.e AuthModule
})
export class UserModule { }
import { Module } from '@nestjs/common';
import { RefreshTokenService } from './refresh-token.service.js';
import { MongooseModule } from '@nestjs/mongoose';
import { RefreshToken, RefreshTokenSchema } from './schemas/refresh-token.schema.js';

@Module({
    imports: [
        // This provides "RefreshTokenModel" (or @InjectModel(RefreshToken.name)) to the module
        MongooseModule.forFeature([{ name: RefreshToken.name, schema: RefreshTokenSchema }]),
    ],
    providers: [RefreshTokenService],
    exports: [RefreshTokenService],

})
export class RefreshTokenModule {}

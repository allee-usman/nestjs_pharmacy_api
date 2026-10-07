import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { UserRole } from '../enums/user-role.enum.js';

export type UserDocument = HydratedDocument<User>;

@Schema({
    timestamps: true,
})
export class User {
    @Prop({
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    })
    email: string;

    @Prop({
        required: true,
    })
    passwordHash: string;

    @Prop({
        type: String,
        enum: UserRole,
        default: UserRole.USER,
    })
    role: UserRole;

    @Prop({
        default: false,
    })
    isEmailVerified: boolean;

    createdAt: Date;
    updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
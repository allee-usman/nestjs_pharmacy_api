import { BadRequestException, ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model } from 'mongoose';

import { User, UserDocument } from './schemas/user.schema.js';
import { CreateUserInput } from './types/create-user.input.js';
import { isMongoDuplicateKeyError } from './utlis/is-mongo-duplicate-key-error.js';
import { UserProfile } from './types/user-profile.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { argon2 } from 'crypto';
import { PasswordService } from '../auth/password.service.js';

@Injectable()
export class UserService {
    constructor(
        @InjectModel(User.name)
        private readonly userModel: Model<UserDocument>,
        private readonly passwordService: PasswordService
    ) { }

    async createUser(input: CreateUserInput): Promise<UserDocument> {
        try {
            const user = new this.userModel(input);
            return await user.save();

        } catch (error) {
            if (isMongoDuplicateKeyError(error)) {
                throw new ConflictException('Email is already registered');
            }
            throw error;
        }
    }

    async findByEmail(email: string): Promise<UserDocument | null> {
        return this.userModel.findOne({ email }).exec();
    }

    async findById(
        id: string,
        session?: ClientSession,
    ): Promise<UserDocument | null> {
        const query = this.userModel.findById(id);

        if (session) {
            query.session(session);
        }

        return query.exec();
    }

    async getProfile(id: string): Promise<UserProfile> {
        const user = await this.findById(id);

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return {
            id: user._id.toString(),
            email: user.email,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
        };
    }


    async updateProfile(
        id: string,
        dto: UpdateProfileDto,
    ): Promise<UserProfile> {
        const user = await this.findById(id);

        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (dto.email && dto.email !== user.email) {
            const existingUser = await this.findByEmail(dto.email);

            if (existingUser) {
                throw new ConflictException('Email is already registered');
            }

            user.email = dto.email;
        }

        await user.save();

        return {
            id: user._id.toString(),
            email: user.email,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
        };
    }


    async changePassword(
        id: string,
        dto: ChangePasswordDto,
    ): Promise<{ message: string }> {
        const user = await this.findById(id);

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const isPasswordValid = await this.passwordService.verify(
            user.passwordHash,
            dto.currentPassword,
        );

        if (!isPasswordValid) {
            throw new UnauthorizedException('Current password is incorrect');
        }

        if (dto.currentPassword === dto.newPassword) {
            throw new BadRequestException(
                'New password must be different from the current password',
            );
        }

        user.passwordHash = await this.passwordService.hash(dto.newPassword);
        await user.save();

        return { message: 'Password changed successfully' };
    }
}
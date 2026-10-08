import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model } from 'mongoose';

import { User, UserDocument } from './schemas/user.schema.js';
import { CreateUserInput } from './types/create-user.input.js';
import { isMongoDuplicateKeyError } from './utlis/is-mongo-duplicate-key-error.js';

@Injectable()
export class UserService {
    constructor(
        @InjectModel(User.name)
        private readonly userModel: Model<UserDocument>,
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
}
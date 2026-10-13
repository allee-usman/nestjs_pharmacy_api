import {
    Body,
    Controller,
    Get,
    Param,
    Patch,
    UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.js';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import { UserService } from './user.service.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';

@Controller('users')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Get('me')
    @UseGuards(JwtAuthGuard)
    getMe(@CurrentUser() user: AuthenticatedUser) {
        return user;
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    getUserById(
        @Param('id', ParseObjectIdPipe) id: string,
    ) {
        return this.userService.getProfile(id);
    }

    @Patch()
    @UseGuards(JwtAuthGuard)
    updateUser(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateProfileDto) {
        return this.userService.updateProfile(user.id, dto)
    }

    @Patch('password')
    @UseGuards(JwtAuthGuard)
    updateUserPassword(@CurrentUser() user: AuthenticatedUser, @Body() dto: ChangePasswordDto) {
        return this.userService.changePassword(user.id, dto);
    }
}
import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Query,
    UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.js';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import { UserService } from './user.service.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { QueryUsersDto } from './dto/query-users.dto.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from './enums/user-role.enum.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { UpdateUserRoleDto } from './dto/update-user-role.dto.js';

@Controller('users')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Get()
    @Roles(UserRole.ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    getAllUsers(@Query() dto: QueryUsersDto) {
        return this.userService.findAll(dto);
    }

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

    @Delete(':id')
    @Roles(UserRole.ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    deleteUser(@Param('id', ParseObjectIdPipe) id: string) {
        return this.userService.deleteUser(id);
    }

    @Patch(':id/role')
    @Roles(UserRole.ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    updateUserRole(@Param('id', ParseObjectIdPipe) id: string, @Body() dto: UpdateUserRoleDto) {
        return this.userService.updateUserRole(id, dto);
    }
}
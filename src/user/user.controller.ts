import {
    Controller,
    Get,
    UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from './enums/user-role.enum.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.js';

@Controller('users')
export class UserController {
    @Get('me')
    @UseGuards(JwtAuthGuard)
    getMe(@CurrentUser() user: AuthenticatedUser) {
        return user;
    }

    @Get('admin-only')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    adminOnly() {
        return {
            message: 'You are an admin',
        };
    }
}
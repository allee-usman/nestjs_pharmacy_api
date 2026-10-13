import type { UserRole } from '../enums/user-role.enum.js';

export interface UserProfile {
    id: string;
    email: string;
    role: UserRole;
    isEmailVerified: boolean;
}
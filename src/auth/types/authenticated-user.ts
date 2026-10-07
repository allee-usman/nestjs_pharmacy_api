import { UserRole } from "../../user/enums/user-role.enum.js";

export interface AuthenticatedUser {
    id: string;
    email: string;
    role: UserRole;
    isEmailVerified: boolean;
}
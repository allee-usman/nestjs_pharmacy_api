import type { AuthenticatedUser } from '../auth/types/authenticated-user.js';

declare global {
    namespace Express {
        interface Request {
            user: AuthenticatedUser;
        }
    }
}
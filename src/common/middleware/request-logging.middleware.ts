
import {
    Injectable,
    Logger,
    NestMiddleware,
} from '@nestjs/common';
import type {
    NextFunction,
    Request,
    Response,
} from 'express';

@Injectable()
export class RequestLoggingMiddleware
    implements NestMiddleware {
    private readonly logger = new Logger(
        RequestLoggingMiddleware.name,
    );

    use(
        request: Request,
        response: Response,
        next: NextFunction,
    ): void {
        this.logger.log(
            `Incoming request: ${request.method} ${request.originalUrl}`,
        );

        next();
    }
}
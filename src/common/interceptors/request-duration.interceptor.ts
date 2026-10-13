import {
    CallHandler,
    ExecutionContext,
    Injectable,
    Logger,
    NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class RequestDurationInterceptor
    implements NestInterceptor {
    private readonly logger = new Logger(
        RequestDurationInterceptor.name,
    );

    intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Observable<unknown> {
        const request = context.switchToHttp().getRequest();

        const startedAt = performance.now();

        return next.handle().pipe(
            tap({
                next: () => {
                    const duration = performance.now() - startedAt;

                    this.logger.log(
                        `${request.method} ${request.url} - ${duration.toFixed(2)} ms`,
                    );
                },
                error: () => {
                    const duration = performance.now() - startedAt;

                    this.logger.warn(
                        `${request.method} ${request.url} failed after ${duration.toFixed(2)} ms`,
                    );
                },
            }),
        );
    }
}
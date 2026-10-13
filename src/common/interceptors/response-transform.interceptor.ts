
import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';

@Injectable()
export class ResponseTransformInterceptor
    implements NestInterceptor {
    intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Observable<unknown> {
        return next.handle().pipe(
            map((data: unknown) => ({ // Unlike tap(), which observes values without changing them, map() changes the emitted value.
                success: true,
                data,
            })),
        );
    }
}
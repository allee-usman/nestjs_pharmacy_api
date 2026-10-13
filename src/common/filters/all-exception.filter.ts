
import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionFilter.name);

    constructor(
        private readonly httpAdapterHost: HttpAdapterHost,
    ) { }

    catch(exception: unknown, host: ArgumentsHost): void {
        const { httpAdapter } = this.httpAdapterHost;
        const ctx = host.switchToHttp();
        const request = ctx.getRequest();

        let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
        let message: string | string[] = 'Internal server error';

        if (exception instanceof HttpException) {
            statusCode = exception.getStatus();

            const exceptionResponse = exception.getResponse();

            if (typeof exceptionResponse === 'string') {
                message = exceptionResponse;
            } else if (
                typeof exceptionResponse === 'object' &&
                exceptionResponse !== null &&
                'message' in exceptionResponse
            ) {
                const responseMessage = exceptionResponse.message;

                if (
                    typeof responseMessage === 'string' ||
                    (Array.isArray(responseMessage) &&
                        responseMessage.every(
                            (item) => typeof item === 'string',
                        ))
                ) {
                    message = responseMessage;
                } else {
                    message = exception.message;
                }
            } else {
                message = exception.message;
            }
        } else {
            this.logger.error(
                `Unhandled exception on ${request.method} ${request.url}`,
                exception instanceof Error
                    ? exception.stack
                    : String(exception),
            );
        }

        httpAdapter.reply(
            ctx.getResponse(),
            {
                statusCode,
                message,
                path: request.url,
                timestamp: new Date().toISOString(),
            },
            statusCode,
        );
    }
}
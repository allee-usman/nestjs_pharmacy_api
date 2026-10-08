import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Catch(HttpException)
export class HttpExceptionFilter
    implements ExceptionFilter {
    
    constructor(private configService: ConfigService) {}    
    catch(
        exception: HttpException,
        host: ArgumentsHost,
    ) {
        const ctx = host.switchToHttp();

        const response = ctx.getResponse();
        const request = ctx.getRequest<Response>();

        const status = exception.getStatus();

        const isProduction = this.configService.get<string>('NODE_ENV') === 'production'

        response.status(status).json(
            isProduction ?
            {
                statusCode: status,
                message: exception.message,
                path: request.url,
                timestamp: new Date().toISOString(),
            }
            : {
                statusCode: status,
                message: exception.message,
                path: request.url,
                timestamp: new Date().toISOString(),
                stack: exception.stack,
            }
        );
    }
}
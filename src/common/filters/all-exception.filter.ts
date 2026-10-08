import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from "@nestjs/common";
import { HttpAdapterHost } from "@nestjs/core";

@Catch()
export class AllExceptionFilter
    implements ExceptionFilter {


    constructor(private httpAdapterHost: HttpAdapterHost) {}    

    catch(exception: unknown, host: ArgumentsHost) {
        const { httpAdapter } = this.httpAdapterHost;
        const ctx = host.switchToHttp();

        const httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;

        const responseBody = {
            status: httpStatus,
            message: "Internal Server Error!",
        }

        httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);

        
    }

}
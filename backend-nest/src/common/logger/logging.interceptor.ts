import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger('HTTP');

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const ctx = context.switchToHttp();
        const req = ctx.getRequest();
        const res = ctx.getResponse();

        const { method, url, body, query, params, user } = req;
        const userStr = user ? `[User: ${user.sub || user._id}]` : '[Anonymous]';
        const now = Date.now();

        // Sanitize body (don't log passwords)
        const sanitizedBody = { ...body };
        if (sanitizedBody.password) sanitizedBody.password = '***';

        return next.handle().pipe(
            tap({
                // On success
                next: (data) => {
                    const delay = Date.now() - now;
                    const statusCode = res.statusCode;

                    this.logger.log({
                        message: `${method} ${url} ${statusCode} ${delay}ms ${userStr}`,
                        method,
                        request_status: 'success',
                        url,
                        statusCode,
                        delay,
                        user: userStr,
                        body: sanitizedBody,
                        params,
                        query,
                        responseSize: JSON.stringify(data || {}).length
                    });
                },
                // On error
                error: (error) => {
                    const delay = Date.now() - now;
                    const statusCode = error.status || 500;

                    this.logger.error({
                        message: `${method} ${url} ${statusCode} ${delay}ms ${userStr} - ${error.message}`,
                        method,
                        request_status: 'failure',
                        url,
                        statusCode,
                        delay,
                        user: userStr,
                        body: sanitizedBody,
                        error: error.message,
                        stack: error.stack
                    });
                }
            }),
        );
    }
}

import logger from '../config/logger.js';

const requestLogger = (req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        const message = `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`;

        // Log everything as info, but warnings for 4xx and errors for 5xx
        if (res.statusCode >= 500) {
            logger.error(message, {
                method: req.method,
                url: req.originalUrl,
                status: res.statusCode,
                duration,
                ip: req.ip,
                userAgent: req.get('user-agent')
            });
        } else if (res.statusCode >= 400) {
            logger.warn(message, {
                method: req.method,
                url: req.originalUrl,
                status: res.statusCode,
                duration,
                ip: req.ip
            });
        } else {
            logger.info(message, {
                method: req.method,
                url: req.originalUrl,
                status: res.statusCode,
                duration,
                ip: req.ip
            });
        }
    });

    next();
};

export default requestLogger;

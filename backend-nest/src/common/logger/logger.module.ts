import { Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { ElasticsearchTransport } from 'winston-elasticsearch';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
    imports: [
        WinstonModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => {
                const esUrl = configService.get<string>('ELASTICSEARCH_URL') || 'http://localhost:9200';

                const esTransportOpts = {
                    level: 'info',
                    clientOpts: { node: esUrl },
                    indexPrefix: 'courier-service',
                    source: 'backend-nest',
<<<<<<< HEAD
=======
                    buffering: false,
                    flushInterval: 2000,
>>>>>>> ba977d1 (fix: resolve online status race condition, add active orders endpoint, impl api logging)
                };

                const transports: winston.transport[] = [
                    new winston.transports.Console({
                        format: winston.format.combine(
                            winston.format.timestamp(),
                            winston.format.ms(),
                            winston.format.simple(), // nest-like friendly format
                        ),
                    }),
                ];

                // Only add ES transport if URL is provided or we strictly want it
                // The original code had error handling for ES connection.
                // winston-elasticsearch handles connection issues internally usually, but let's add it.
                const esTransport = new ElasticsearchTransport(esTransportOpts);

                esTransport.on('error', (error) => {
                    console.error('Elasticsearch Logger Error:', error);
                });

                transports.push(esTransport);

                return {
                    transports,
                    defaultMeta: { service: 'courier-backend' },
                };
            },
            inject: [ConfigService],
        }),
    ],
    exports: [WinstonModule],
})
export class LoggerModule { }

import winston from 'winston';
import { ElasticsearchTransport } from 'winston-elasticsearch';

const esTransportOpts = {
    level: 'info',
    clientOpts: { node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200' }, // Use localhost for local dev
    indexPrefix: 'courier-service',
    source: 'backend'
};

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    defaultMeta: { service: 'courier-backend' },
    transports: [
        new winston.transports.Console({
            format: winston.format.simple()
        }),
        new ElasticsearchTransport(esTransportOpts)
    ]
});

// Handle connection errors gracefully
const esTransport = logger.transports.find(t => t instanceof ElasticsearchTransport);
if (esTransport) {
    esTransport.on('error', (error) => {
        console.error('Elasticsearch Logger Error:', error);
    });
}

export default logger;
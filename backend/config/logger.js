import winston from 'winston';
import { ElasticsearchTransport } from 'winston-elasticsearch';

const esTransportOpts = {
    level: 'info',
    clientOpts: {
        node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
        auth: {
            username: process.env.ELASTICSEARCH_USERNAME,
            password: process.env.ELASTICSEARCH_PASSWORD
        }
    },
    indexPrefix: 'courier-logs',
    indexSuffixPattern: 'YYYY.MM.DD'
};

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        })
    ]
});

// Add Elasticsearch transport only if node is defined (or always add it and let it fail gracefully/retry?)
// Better to check env, but I put a default localhost above.
// Ideally usage:
if (process.env.ELASTICSEARCH_NODE) {
    const esTransport = new ElasticsearchTransport(esTransportOpts);

    esTransport.on('error', (error) => {
        console.error('Elasticsearch Transport Error:', error);
    });

    logger.add(esTransport);
}

export default logger;

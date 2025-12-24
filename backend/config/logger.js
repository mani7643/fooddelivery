import winston from 'winston';
import { createRequire } from 'module';
import { Client } from '@opensearch-project/opensearch';

const require = createRequire(import.meta.url);
const winstonOpenSearch = require('winston-opensearch');
// Ensure we get the constructor regardless of how it's exported (CJS/ESM interop)
const OpenSearchTransport = winstonOpenSearch.OpenSearchTransport || winstonOpenSearch.default || winstonOpenSearch;

const osClient = new Client({
    node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
    auth: {
        username: process.env.ELASTICSEARCH_USERNAME,
        password: process.env.ELASTICSEARCH_PASSWORD
    }
});

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

// Configure Transport
if (process.env.ELASTICSEARCH_NODE) {
    // Check if OpenSearchTransport is actually a constructor
    if (typeof OpenSearchTransport === 'function') {
        const osTransport = new OpenSearchTransport({
            client: osClient,
            index: 'courier-logs'
        });

        osTransport.on('error', (error) => {
            console.error('OpenSearch Transport Error:', error);
        });

        logger.add(osTransport);
    } else {
        console.error('❌ Failed to initialize OpenSearch Transport: OpenSearchTransport is not a constructor', typeof OpenSearchTransport);
    }
}

export default logger;

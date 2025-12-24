import winston from 'winston';
import { createRequire } from 'module';
import { Client } from '@opensearch-project/opensearch';

const require = createRequire(import.meta.url);
const winstonOpenSearch = require('winston-opensearch');
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

if (process.env.ELASTICSEARCH_NODE) {
    if (typeof OpenSearchTransport === 'function') {
        console.log('🌐 Initializing OpenSearch Transport...');
        const osTransport = new OpenSearchTransport({
            client: osClient,
            indexPrefix: 'courier-logs',
            // Ensure indices are created if they don't exist
            ensureIndexTemplate: true
        });

        osTransport.on('error', (error) => {
            console.error('❌ OpenSearch Transport Error:', error);
        });

        // Some transports emit 'warn' or 'info' events too

        logger.add(osTransport);
        console.log('✅ OpenSearch Transport added to Winston');
    } else {
        console.error('❌ Failed to initialize OpenSearch Transport: OpenSearchTransport is not a constructor', typeof OpenSearchTransport);
    }
} else {
    console.log('ℹ️ OpenSearch logging disabled (ELASTICSEARCH_NODE not set)');
}

export default logger;

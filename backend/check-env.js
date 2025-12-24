import 'dotenv/config';

console.log('--- Environment Check ---');
console.log('ELASTICSEARCH_NODE present:', !!process.env.ELASTICSEARCH_NODE);
console.log('ELASTICSEARCH_USERNAME present:', !!process.env.ELASTICSEARCH_USERNAME);
console.log('ELASTICSEARCH_PASSWORD present:', !!process.env.ELASTICSEARCH_PASSWORD);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('-------------------------');

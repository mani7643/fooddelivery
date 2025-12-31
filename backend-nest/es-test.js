const { Client } = require('@elastic/elasticsearch');
const client = new Client({ node: 'http://localhost:9200' });

async function run() {
    try {
        await client.index({
            index: 'courier-manual-test',
            body: {
                message: 'Hello World',
                timestamp: new Date()
            }
        });
        console.log('Document indexed');
        await client.indices.refresh({ index: 'courier-manual-test' });
        const result = await client.cat.indices({ v: true });
        console.log(result);
    } catch (err) {
        console.error('Error:', err);
    }
}
run();

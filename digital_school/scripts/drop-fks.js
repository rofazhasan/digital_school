const { Client } = require('pg');

const destUrl = process.env.AIVEN_DATABASE_URL;

if (!destUrl) {
    console.error("Please set AIVEN_DATABASE_URL environment variable.");
    process.exit(1);
}

async function dropFKs() {
    const client = new Client({ connectionString: destUrl, ssl: { rejectUnauthorized: false } });
    await client.connect();

    try {
        const res = await client.query(`
            SELECT table_name, constraint_name 
            FROM information_schema.table_constraints 
            WHERE constraint_type = 'FOREIGN KEY' 
            AND table_schema = 'public';
        `);

        console.log(`Found ${res.rows.length} FK constraints to drop.`);

        for (const r of res.rows) {
            console.log(`Dropping ${r.constraint_name} on ${r.table_name}...`);
            await client.query(`ALTER TABLE "${r.table_name}" DROP CONSTRAINT "${r.constraint_name}"`);
        }

        console.log("All FKs dropped.");

    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

dropFKs();

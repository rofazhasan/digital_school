const { Client } = require('pg');

const neonUrl = process.env.NEON_DATABASE_URL;
const aivenUrl = process.env.AIVEN_DATABASE_URL;

if (!neonUrl || !aivenUrl) {
    console.error("Please set NEON_DATABASE_URL and AIVEN_DATABASE_URL environment variables.");
    process.exit(1);
}

async function migrate() {
    console.log("Connecting...");
    const source = new Client({ connectionString: neonUrl, ssl: { rejectUnauthorized: false } });
    const dest = new Client({ connectionString: aivenUrl, ssl: { rejectUnauthorized: false } });

    await source.connect();
    await dest.connect();

    try {
        // 1. Fetch Schema Information for Types
        console.log("Fetching schema information...");
        const typeRes = await dest.query(`
            SELECT table_name, column_name, data_type, udt_name
            FROM information_schema.columns 
            WHERE table_schema = 'public';
        `);

        const typeMap = {}; // typeMap[table][column] = 'jsonb' | 'array' ...
        typeRes.rows.forEach(r => {
            if (!typeMap[r.table_name]) typeMap[r.table_name] = {};
            typeMap[r.table_name][r.column_name] = r.data_type;
        });

        // 2. Get all tables
        const res = await source.query(`
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename != '_prisma_migrations';
        `);

        let pendingTables = res.rows.map(r => r.tablename);
        console.log(`Found ${pendingTables.length} tables to migrate.`);

        let progress = true;
        let pass = 1;

        while (pendingTables.length > 0 && progress) {
            console.log(`\n--- Pass ${pass} --- (Pending: ${pendingTables.length})`);
            progress = false;
            const nextPending = [];

            for (const table of pendingTables) {
                try {
                    // console.log(`Migrating ${table}...`);

                    const data = await source.query(`SELECT * FROM public."${table}"`);
                    const rows = data.rows;

                    if (rows.length === 0) {
                        // console.log(`  ${table}: Empty.`);
                        progress = true;
                        continue;
                    }

                    const columns = Object.keys(rows[0]);
                    const columnNames = columns.map(c => `"${c}"`).join(', ');
                    const chunkSize = 50;

                    let tableFailed = false;

                    for (let i = 0; i < rows.length; i += chunkSize) {
                        const chunk = rows.slice(i, i + chunkSize);
                        let paramIndex = 1;
                        const params = [];
                        const valueSets = [];

                        chunk.forEach(row => {
                            const rowValues = [];
                            columns.forEach(key => {
                                let val = row[key];
                                const type = typeMap[table] ? typeMap[table][key] : null;

                                // Handle JSON serialization
                                if (val !== null && typeof val === 'object' && (type === 'json' || type === 'jsonb')) {
                                    val = JSON.stringify(val);
                                }

                                params.push(val);
                                rowValues.push(`$${paramIndex++}`);
                            });
                            valueSets.push(`(${rowValues.join(', ')})`);
                        });

                        const query = `INSERT INTO public."${table}" (${columnNames}) VALUES ${valueSets.join(', ')} ON CONFLICT DO NOTHING`;

                        try {
                            await dest.query(query, params);
                        } catch (err) {
                            if (err.code === '23503') { // ForeignKeyViolation
                                tableFailed = true;
                                break;
                            } else {
                                console.error(`Error inserting into ${table}:`, err.message);
                                throw err; // Other errors are fatal
                            }
                        }
                    }

                    if (!tableFailed) {
                        console.log(`  ${table}: Success (${rows.length} rows).`);
                        progress = true;
                    } else {
                        // console.log(`  ${table}: Postponed (FK).`);
                        nextPending.push(table);
                    }

                } catch (e) {
                    console.error(`  Error processing ${table}:`, e.message);
                    throw e;
                }
            }

            pendingTables = nextPending;
            console.log(`Pass ${pass} result: ${pendingTables.length} remaining.`);
            pass++;
        }

        if (pendingTables.length > 0) {
            console.log("\nTrying Final Attempt for remaining tables (ignoring FK if possible? No/Dangerous)");
            console.error("Migration finished but some tables failed:", pendingTables.join(', '));
        } else {
            console.log("\nMigration Complete Successfully!");
        }

    } catch (e) {
        console.error("Migration Fatal Error:", e);
    } finally {
        await source.end();
        await dest.end();
    }
}

migrate();

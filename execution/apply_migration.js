/**
 * apply_migration.js
 * ------------------
 * Execution script: connects to Supabase PostgreSQL directly and runs
 * the contacerta_migration.sql file.
 *
 * Usage: node execution/apply_migration.js
 * Requires: pg (npm install pg)
 *
 * Connection string comes from .env (DATABASE_URL) or can be passed
 * as an argument.
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATABASE_URL =
    process.argv[2] ||
    process.env.DATABASE_URL ||
    'postgres://postgres:Nexusmn1268@db.kfluxbcgakftsbquuwxn.supabase.co:5432/postgres';

const MIGRATION_FILE = path.resolve(__dirname, '..', 'directives', 'contacerta_migration.sql');

async function main() {
    console.log('📄 Reading migration file:', MIGRATION_FILE);
    const sql = fs.readFileSync(MIGRATION_FILE, 'utf-8');

    console.log('🔌 Connecting to database...');
    const client = new pg.Client({
        connectionString: DATABASE_URL,
        ssl: { rejectUnauthorized: false },
    });

    try {
        await client.connect();
        console.log('✅ Connected!');

        console.log('🚀 Running migration...');
        await client.query(sql);
        console.log('✅ Migration applied successfully!');

        // Verify tables
        const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

        console.log('\n📋 Public tables:');
        result.rows.forEach((row) => console.log('   •', row.table_name));

        // Verify default group seed
        const groupCheck = await client.query(
            `SELECT id, name FROM groups WHERE id = '00000000-0000-0000-0000-000000000001'`
        );
        if (groupCheck.rows.length > 0) {
            console.log('\n🌱 Default group exists:', groupCheck.rows[0].name);
        }

        console.log('\n🎉 Done! Database is ready.');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

main();

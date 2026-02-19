/**
 * apply_pagamentos_migration.js
 * Applies the pagamentos migration via direct PostgreSQL connection.
 * Usage: node execution/apply_pagamentos_migration.js
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATABASE_URL =
    process.env.DATABASE_URL ||
    'postgres://postgres:Nexusmn1268@db.kfluxbcgakftsbquuwxn.supabase.co:5432/postgres';

const MIGRATION_FILE = path.resolve(__dirname, '..', 'directives', 'pagamentos_migration.sql');

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

        console.log('🚀 Running pagamentos migration...');
        await client.query(sql);
        console.log('✅ Migration applied successfully!');

        // Verify tables
        const result = await client.query(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
        );
        console.log('\n📋 Public tables:');
        result.rows.forEach((row) => console.log('   •', row.table_name));

        // Verify RLS policies
        const rls = await client.query(
            "SELECT policyname FROM pg_policies WHERE tablename = 'pagamentos'"
        );
        console.log('\n🔒 RLS policies on pagamentos:');
        rls.rows.forEach((row) => console.log('   •', row.policyname));

        // Verify table structure
        const cols = await client.query(
            "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'pagamentos' ORDER BY ordinal_position"
        );
        console.log('\n📐 Pagamentos columns:');
        cols.rows.forEach((row) => console.log('   •', row.column_name, '-', row.data_type));

        console.log('\n🎉 Done! Pagamentos table is ready.');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

main();

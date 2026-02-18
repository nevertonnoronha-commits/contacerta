/**
 * verify_schema.js
 * ----------------
 * Quick verification script to confirm tables and seed data exist.
 */

import pg from 'pg';

const DATABASE_URL =
    process.env.DATABASE_URL ||
    'postgres://postgres:Nexusmn1268@db.kfluxbcgakftsbquuwxn.supabase.co:5432/postgres';

async function main() {
    const client = new pg.Client({
        connectionString: DATABASE_URL,
        ssl: { rejectUnauthorized: false },
    });

    try {
        await client.connect();

        // 1. List public tables
        const tables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
        console.log('📋 Public tables:');
        tables.rows.forEach((r) => console.log('   •', r.table_name));

        // 2. Check RLS is enabled
        const rls = await client.query(`
      SELECT tablename, rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename IN ('groups', 'participantes', 'despesas', 'expense_splits');
    `);
        console.log('\n🔒 RLS status:');
        rls.rows.forEach((r) => console.log('   •', r.tablename, '→', r.rowsecurity ? 'ENABLED ✅' : 'DISABLED ❌'));

        // 3. Check default group
        const group = await client.query(
            `SELECT id, name FROM groups WHERE id = '00000000-0000-0000-0000-000000000001'`
        );
        console.log('\n🌱 Default group:', group.rows.length > 0 ? `"${group.rows[0].name}" ✅` : 'MISSING ❌');

        // 4. Count policies
        const policies = await client.query(`
      SELECT tablename, policyname
      FROM pg_policies
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname;
    `);
        console.log('\n📜 RLS Policies (' + policies.rows.length + '):');
        policies.rows.forEach((r) => console.log('   •', r.tablename, '→', r.policyname));

        console.log('\n🎉 Schema verification complete!');
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

main();

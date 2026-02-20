const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('Checking "grupos" table...');
    // Try to select * to see columns
    const { data, error } = await supabase.from('grupos').select('*').limit(1);

    if (error) {
        console.error('Error selecting from grupos:', error);
        // If error is "relation does not exist", table is missing.
    } else {
        console.log('Table "grupos" exists.');
        console.log('Row count:', data.length);
        if (data.length > 0) {
            console.log('Sample row:', data[0]);
            console.log('Columns detected:', Object.keys(data[0]));
        } else {
            console.log('Table is empty. Attempting to insert a dummy group with name to check schema...');
            const { data: insertData, error: insertError } = await supabase
                .from('grupos')
                .insert({ nome: 'Test Group' })
                .select();

            if (insertError) {
                console.error('Insert failed:', insertError);
            } else {
                console.log('Insert success! "nome" column exists.');
                console.log('Inserted:', insertData);
                // Clean up?
                // await supabase.from('grupos').delete().eq('id', insertData[0].id);
            }
        }
    }
}

check();

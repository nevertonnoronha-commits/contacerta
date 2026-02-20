const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'app/.env' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function verifyGroups() {
    console.log('--- START GROUP VERIFICATION ---');

    // 1. Create a new group
    const groupName = `Group_${Date.now()}`;
    console.log(`Creating group: ${groupName}`);
    const { data: group, error: createError } = await supabase
        .from('groups')
        .insert({ name: groupName })
        .select()
        .single();
    if (createError) throw createError;
    console.log('Group created:', group);

    // 2. Add data to this group
    console.log('Adding participant to group...');
    const { data: participant, error: partError } = await supabase
        .from('participantes')
        .insert({ nome: 'User A', group_id: group.id })
        .select()
        .single();
    if (partError) throw partError;
    console.log('Participant added:', participant);

    // 3. Verify data isolation (should see 1 participant in this group)
    console.log('Verifying isolation...');
    const { data: parts, error: fetchError } = await supabase
        .from('participantes')
        .select('*')
        .eq('group_id', group.id);
    if (fetchError) throw fetchError;
    console.log(`Found ${parts.length} participants in group ${group.id}`);
    if (parts.length !== 1) throw new Error('Isolation failed!');

    // 4. Cleanup
    console.log('Cleaning up...');
    await supabase.from('participantes').delete().eq('group_id', group.id);
    await supabase.from('groups').delete().eq('id', group.id);
    console.log('Cleanup complete.');
    console.log('--- VERIFICATION SUCCESS ---');
}

verifyGroups().catch(console.error);

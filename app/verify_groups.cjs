const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Verify env vars
if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
    console.error('Missing env vars!');
    process.exit(1);
}

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function verifyGroups() {
    console.log('--- START GROUP VERIFICATION ---');

    console.log('1. Creating a new group...');
    const groupName = `Group_${Date.now()}`;
    const { data: group, error: createError } = await supabase
        .from('groups')
        .insert({ name: groupName })
        .select()
        .single();
    if (createError) throw createError;
    console.log('   Group created:', group.id, group.name);

    console.log('2. Adding participant to group...');
    const { data: participant, error: partError } = await supabase
        .from('participantes')
        .insert({ nome: 'User A', group_id: group.id })
        .select()
        .single();
    if (partError) throw partError;
    console.log('   Participant added:', participant.id, participant.nome);

    console.log('3. Verifying isolation (should see 1 participant in this group)...');
    const { data: parts, error: fetchError } = await supabase
        .from('participantes')
        .select('*')
        .eq('group_id', group.id);
    if (fetchError) throw fetchError;
    console.log(`   Found ${parts.length} participants in group ${group.id}`);

    if (parts.length !== 1) throw new Error('Isolation failed! Expected 1 participant.');
    if (parts[0].id !== participant.id) throw new Error('Isolation failed! Wrong participant found.');

    console.log('4. Cleaning up...');
    await supabase.from('participantes').delete().eq('group_id', group.id);
    await supabase.from('groups').delete().eq('id', group.id);
    console.log('   Cleanup complete.');
    console.log('--- VERIFICATION SUCCESS ---');
}

verifyGroups().catch(err => {
    console.error('VERIFICATION FAILED:', err);
    process.exit(1);
});

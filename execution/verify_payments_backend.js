
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env from app directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../app/.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const DEFAULT_GROUP_ID = process.env.VITE_DEFAULT_GROUP_ID || '00000000-0000-0000-0000-000000000001';

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Mock data (need valid IDs from DB, but for now we'll just test the function mechanics if possible,
// or fetch participants first)

async function testPayments() {
    console.log('🧪 Testing Payments CRUD...');

    // 1. Get Participants to have valid IDs
    const { data: parts, error: partsErr } = await supabase
        .from('participantes')
        .select('id, nome')
        .eq('group_id', DEFAULT_GROUP_ID);

    if (partsErr) {
        console.error('❌ Error fetching participants:', partsErr);
        return;
    }

    if (parts.length < 2) {
        console.warn('⚠️ Not enough participants to test payments (need at least 2).');
        return;
    }

    const payer = parts[0];
    const receiver = parts[1];
    console.log(`👤 Payer: ${payer.nome} (${payer.id})`);
    console.log(`👤 Receiver: ${receiver.nome} (${receiver.id})`);

    // 2. Add Payment
    console.log('--- Adding Payment ---');
    const { data: newPayment, error: addErr } = await supabase
        .from('pagamentos')
        .insert({
            group_id: DEFAULT_GROUP_ID,
            pagador_id: payer.id,
            recebedor_id: receiver.id,
            valor: 50.00,
            data: new Date().toISOString().slice(0, 10)
        })
        .select()
        .single();

    if (addErr) {
        console.error('❌ Error adding payment:', addErr);
        return;
    }
    console.log('✅ Payment added:', newPayment.id, 'Value:', newPayment.valor);

    // 3. Fetch Payments
    console.log('--- Fetching Payments ---');
    const { data: list, error: listErr } = await supabase
        .from('pagamentos')
        .select('*')
        .eq('group_id', DEFAULT_GROUP_ID);

    if (listErr) {
        console.error('❌ Error fetching list:', listErr);
        return;
    }
    console.log('✅ Payments found:', list.length);
    const found = list.find(p => p.id === newPayment.id);
    if (found) {
        console.log('✅ Created payment found in list.');
    } else {
        console.error('❌ Created payment NOT found in list.');
    }

    // 4. Delete Payment
    console.log('--- Deleting Payment ---');
    const { error: delErr } = await supabase
        .from('pagamentos')
        .delete()
        .eq('id', newPayment.id);

    if (delErr) {
        console.error('❌ Error deleting payment:', delErr);
        return;
    }
    console.log('✅ Payment deleted.');

    // 5. Verify Deletion
    const { data: check, error: checkErr } = await supabase
        .from('pagamentos')
        .select('*')
        .eq('id', newPayment.id)
        .single();

    if (checkErr && checkErr.code === 'PGRST116') { // JSON object requested, result is null (standard for .single() not found)
        console.log('✅ Verification: Payment is gone (PGRST116).');
    } else if (!check) {
        console.log('✅ Verification: Payment is gone (null result).');
    } else {
        console.error('❌ Payment still exists:', check);
    }
}

testPayments();

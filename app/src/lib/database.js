import { supabase, DEFAULT_GROUP_ID } from './supabase';

// ─── Participants ──────────────────────────────────────────

export async function getParticipantes(groupId = DEFAULT_GROUP_ID) {
    const { data, error } = await supabase
        .from('participantes')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
}

export async function addParticipante(nome, groupId = DEFAULT_GROUP_ID) {
    const { data, error } = await supabase
        .from('participantes')
        .insert({ nome, group_id: groupId })
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function deleteParticipante(id) {
    const { error } = await supabase
        .from('participantes')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

// ─── Expenses ──────────────────────────────────────────────

export async function getDespesas(groupId = DEFAULT_GROUP_ID) {
    const { data, error } = await supabase
        .from('despesas')
        .select(`
      *,
      expense_splits (
        id,
        participante_id,
        valor_devido,
        porcentagem
      )
    `)
        .eq('group_id', groupId)
        .order('data', { ascending: false });

    if (error) throw error;

    // Transform to frontend-friendly format
    return data.map(transformDespesaFromDB);
}

export async function addDespesa(despesa, groupId = DEFAULT_GROUP_ID) {
    // 1. Insert the expense
    const { data: newDespesa, error: despesaError } = await supabase
        .from('despesas')
        .insert({
            group_id: groupId,
            descricao: despesa.descricao,
            valor: despesa.valor,
            pagador_id: despesa.pagador,
            data: despesa.data,
            categoria: despesa.categoria,
            tipo_divisao: despesa.divisao.tipo,
        })
        .select()
        .single();

    if (despesaError) throw despesaError;

    // 2. Insert expense splits
    const splits = buildSplits(newDespesa.id, despesa);
    if (splits.length > 0) {
        const { error: splitsError } = await supabase
            .from('expense_splits')
            .insert(splits);

        if (splitsError) {
            // Rollback: delete the expense if splits fail
            await supabase.from('despesas').delete().eq('id', newDespesa.id);
            throw splitsError;
        }
    }

    // 3. Re-fetch to get the full object with splits
    const { data: fullDespesa, error: fetchError } = await supabase
        .from('despesas')
        .select(`*, expense_splits (id, participante_id, valor_devido, porcentagem)`)
        .eq('id', newDespesa.id)
        .single();

    if (fetchError) throw fetchError;
    return transformDespesaFromDB(fullDespesa);
}

export async function updateDespesa(id, despesa) {
    // 1. Update the expense row
    const { error: updateError } = await supabase
        .from('despesas')
        .update({
            descricao: despesa.descricao,
            valor: despesa.valor,
            pagador_id: despesa.pagador,
            data: despesa.data,
            categoria: despesa.categoria,
            tipo_divisao: despesa.divisao.tipo,
        })
        .eq('id', id);

    if (updateError) throw updateError;

    // 2. Delete old splits and re-insert new ones
    const { error: deleteError } = await supabase
        .from('expense_splits')
        .delete()
        .eq('despesa_id', id);

    if (deleteError) throw deleteError;

    const splits = buildSplits(id, despesa);
    if (splits.length > 0) {
        const { error: splitsError } = await supabase
            .from('expense_splits')
            .insert(splits);

        if (splitsError) throw splitsError;
    }

    // 3. Re-fetch full object
    const { data: fullDespesa, error: fetchError } = await supabase
        .from('despesas')
        .select(`*, expense_splits (id, participante_id, valor_devido, porcentagem)`)
        .eq('id', id)
        .single();

    if (fetchError) throw fetchError;
    return transformDespesaFromDB(fullDespesa);
}

export async function deleteDespesa(id) {
    // Splits are cascade-deleted via FK
    const { error } = await supabase
        .from('despesas')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

// ─── Payments (Settle Up) ──────────────────────────────────

export async function getPagamentos(groupId = DEFAULT_GROUP_ID) {
    const { data, error } = await supabase
        .from('pagamentos')
        .select('*')
        .eq('group_id', groupId)
        .order('data', { ascending: false });

    if (error) throw error;
    return data.map((p) => ({
        ...p,
        valor: parseFloat(p.valor),
    }));
}

export async function addPagamento({ pagador_id, recebedor_id, valor, data }, groupId = DEFAULT_GROUP_ID) {
    const { data: newPagamento, error } = await supabase
        .from('pagamentos')
        .insert({
            group_id: groupId,
            pagador_id,
            recebedor_id,
            valor,
            data: data || new Date().toISOString().slice(0, 10),
        })
        .select()
        .single();

    if (error) throw error;
    return { ...newPagamento, valor: parseFloat(newPagamento.valor) };
}

export async function deletePagamento(id) {
    const { error } = await supabase
        .from('pagamentos')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

// ─── Helpers ───────────────────────────────────────────────

/**
 * Build expense_splits rows from frontend despesa object.
 */
function buildSplits(despesaId, despesa) {
    const { divisao, valor } = despesa;
    const envolvidos = divisao.envolvidos || [];

    if (envolvidos.length === 0) return [];

    return envolvidos.map((participanteId) => {
        let valorDevido = 0;
        let porcentagem = null;

        if (divisao.tipo === 'igual') {
            valorDevido = parseFloat((valor / envolvidos.length).toFixed(2));
        } else if (divisao.tipo === 'porcentagem') {
            porcentagem = divisao.valores?.[participanteId] ?? 0;
            valorDevido = parseFloat((valor * porcentagem / 100).toFixed(2));
        } else if (divisao.tipo === 'personalizado') {
            valorDevido = parseFloat(divisao.valores?.[participanteId] ?? 0);
        }

        return {
            despesa_id: despesaId,
            participante_id: participanteId,
            valor_devido: valorDevido,
            porcentagem,
        };
    });
}

/**
 * Transform a DB despesa row (with nested expense_splits) back
 * to the frontend format with a `divisao` object.
 */
function transformDespesaFromDB(row) {
    const splits = row.expense_splits || [];
    const envolvidos = splits.map((s) => s.participante_id);

    const valores = {};
    splits.forEach((s) => {
        if (row.tipo_divisao === 'porcentagem') {
            valores[s.participante_id] = s.porcentagem ?? 0;
        } else if (row.tipo_divisao === 'personalizado') {
            valores[s.participante_id] = s.valor_devido ?? 0;
        }
    });

    return {
        id: row.id,
        descricao: row.descricao,
        valor: parseFloat(row.valor),
        pagador: row.pagador_id,
        data: row.data,
        categoria: row.categoria,
        divisao: {
            tipo: row.tipo_divisao,
            envolvidos,
            valores: Object.keys(valores).length > 0 ? valores : undefined,
        },
    };
}

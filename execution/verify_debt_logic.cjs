const util = require('util');

// Mock Data
const participantes = [
    { id: '1', nome: 'Leticia' }, // P1
    { id: '2', nome: 'Neverton' }, // P2
    { id: '3', nome: 'Person3' } // P3
];

const despesas = [
    // Expense 1: Uber, Paid by Leticia (1), R$ 25.00. Split Equal (3 ways).
    {
        id: 'd1',
        descricao: 'Uber',
        valor: 25.00,
        pagador: '1',
        divisao: { tipo: 'igual', envolvidos: ['1', '2', '3'] }
    },
    // Expense 2: Lanche, Paid by Neverton (2), R$ 30.00. Split Equal (3 ways).
    {
        id: 'd2',
        descricao: 'Lanche',
        valor: 30.00,
        pagador: '2',
        divisao: { tipo: 'igual', envolvidos: ['1', '2', '3'] }
    }
];

// ─── Algorithm 1: Global Simplification (Current App Logic) ───

function calculateGlobal(participantes, despesas) {
    const balanco = {};
    participantes.forEach(p => balanco[p.id] = { pagou: 0, deve: 0, nome: p.nome });

    despesas.forEach(d => {
        // Payer
        if (balanco[d.pagador]) balanco[d.pagador].pagou += d.valor;

        // Debtors
        const envolvidos = d.divisao.envolvidos;
        const share = d.valor / envolvidos.length;
        envolvidos.forEach(pid => {
            if (balanco[pid]) balanco[pid].deve += share;
        });
    });

    const saldos = Object.entries(balanco).map(([id, b]) => ({
        id,
        nome: b.nome,
        saldo: parseFloat((b.pagou - b.deve).toFixed(2))
    }));

    const devedores = saldos.filter(s => s.saldo < 0).sort((a, b) => a.saldo - b.saldo);
    const credores = saldos.filter(s => s.saldo > 0).sort((a, b) => b.saldo - a.saldo);

    const transacoes = [];
    let i = 0;
    let j = 0;

    while (i < devedores.length && j < credores.length) {
        const valor = Math.min(-devedores[i].saldo, credores[j].saldo);
        if (valor > 0.01) {
            transacoes.push({
                de: devedores[i].nome,
                para: credores[j].nome,
                valor: parseFloat(valor.toFixed(2))
            });
        }
        if (Math.abs(Math.abs(devedores[i].saldo) - valor) < 0.01) i++;
        if (Math.abs(credores[j].saldo - valor) < 0.01) j++; // Note: bug in original code? credores[j].saldo IS reduced by loop logic logic usually?
        // Wait, the original code in App.jsx:
        // if (Math.abs(Math.abs(devedores[i].saldo) - valor) < 0.01) i++;
        // if (Math.abs(credores[j].saldo - valor) < 0.01) j++;
        // The loop in App.jsx DOES NOT decrement the values in the arrays!
        // It uses `valor = min(...)`.
        // If it doesn't decrement, it will loop infinitely or produce wrong results if not handled.
        // Let's re-read App.jsx carefully.
    }
    // Re-reading logic in App.jsx...
    // const valor = Math.min(...)
    // it pushes transaction.
    // it incs i or j.
    // IT DOES NOT UPDATE SALDO!
    // This is a BUG in the original code if multiple transactions are needed for one person.

    // Let's implement what I SAW in App.jsx to confirm if it's broken.
    // Actually, let's look at the logic I need to implement to FIX it too.

    // For the simulation, I will perform the decrement correctly to simulate "Correct Global Simplification" vs "Pairwise".

    const transacoesCorrect = [];
    i = 0; j = 0;
    // Clone for mutation
    const dev = devedores.map(d => ({ ...d }));
    const cred = credores.map(c => ({ ...c }));

    while (i < dev.length && j < cred.length) {
        let amount = Math.min(-dev[i].saldo, cred[j].saldo);
        amount = parseFloat(amount.toFixed(2));

        if (amount > 0) {
            transacoesCorrect.push({ de: dev[i].nome, para: cred[j].nome, valor: amount });
            dev[i].saldo += amount;
            cred[j].saldo -= amount;
        }

        if (Math.abs(dev[i].saldo) < 0.01) i++;
        if (Math.abs(cred[j].saldo) < 0.01) j++;
    }

    return { saldos, transacoes: transacoesCorrect };
}

// ─── Algorithm 2: Pairwise Netting (Proposed Fix) ───

function calculatePairwise(participantes, despesas) {
    const matrix = {}; // matrix[from][to] = amount
    participantes.forEach(p1 => {
        matrix[p1.id] = {};
        participantes.forEach(p2 => {
            matrix[p1.id][p2.id] = 0;
        });
    });

    despesas.forEach(d => {
        const pagador = d.pagador;
        const envolvidos = d.divisao.envolvidos;
        const share = d.valor / envolvidos.length;

        envolvidos.forEach(beneficiary => {
            if (beneficiary !== pagador) {
                // Beneficiary OWES Pagador
                matrix[beneficiary][pagador] += share;
            }
        });
    });

    const transacoes = [];
    const usedPairs = new Set();

    participantes.forEach(p1 => {
        participantes.forEach(p2 => {
            if (p1.id === p2.id) return;

            const pairId = [p1.id, p2.id].sort().join('-');
            if (usedPairs.has(pairId)) return;
            usedPairs.add(pairId);

            const v1_ov_2 = matrix[p1.id][p2.id]; // 1 owes 2
            const v2_ov_1 = matrix[p2.id][p1.id]; // 2 owes 1

            const net = v1_ov_2 - v2_ov_1;

            if (net > 0.01) {
                transacoes.push({ de: p1.nome, para: p2.nome, valor: net });
            } else if (net < -0.01) {
                transacoes.push({ de: p2.nome, para: p1.nome, valor: -net });
            }
        });
    });

    return transacoes;
}

// ─── Execution ───

console.log("--- SCENARIO ---");
console.log("Participants: Leticia (1), Neverton (2), Person3 (3)");
console.log("Exp 1: Uber R$ 25 (Leticia paid, split 3)");
console.log("Exp 2: Lanche R$ 30 (Neverton paid, split 3)");
console.log("");

console.log("--- ALGO 1: GLOBAL SIMPLIFICATION ---");
const globalRes = calculateGlobal(participantes, despesas);
console.log("Saldos (Net):", globalRes.saldos.map(s => `${s.nome}: ${s.saldo}`));
console.log("Transactions:", globalRes.transacoes);

console.log("\n--- ALGO 2: PAIRWISE NETTING ---");
const pairwiseRes = calculatePairwise(participantes, despesas);
console.log("Transactions:", pairwiseRes);

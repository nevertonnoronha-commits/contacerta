import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Sun, Moon, Plus, Trash2, Edit3, Download, Users, Receipt,
    LayoutDashboard, X, Filter, ArrowUpDown, DollarSign, TrendingUp,
    PieChart as PieChartIcon, ArrowRight, Loader2, AlertCircle
} from 'lucide-react';
import {
    getParticipantes, addParticipante, deleteParticipante,
    getDespesas, addDespesa, updateDespesa, deleteDespesa,
} from './lib/database';

// ─── Reusable UI Components ─────────────────────────────────

function Card({ children, className = '' }) {
    return (
        <div className={`bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5 ${className}`}>
            {children}
        </div>
    );
}

function Button({ children, onClick, variant = 'primary', size = 'md', disabled = false, className = '' }) {
    const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed';
    const variants = {
        primary: 'bg-violet-600 hover:bg-violet-700 text-white focus:ring-violet-500 shadow-lg shadow-violet-500/25',
        secondary: 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-gray-400',
        danger: 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-400 shadow-lg shadow-red-500/25',
        ghost: 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 focus:ring-gray-400',
    };
    const sizes = {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-4 py-2.5 text-sm',
        lg: 'px-6 py-3 text-base',
    };
    return (
        <button onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}>
            {children}
        </button>
    );
}

function Input({ label, ...props }) {
    return (
        <div className="space-y-1.5">
            {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>}
            <input {...props} className={`w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all text-sm ${props.className || ''}`} />
        </div>
    );
}

function Select({ label, children, ...props }) {
    return (
        <div className="space-y-1.5">
            {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>}
            <select {...props} className={`w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all text-sm ${props.className || ''}`}>
                {children}
            </select>
        </div>
    );
}

function Badge({ children, color = 'violet' }) {
    const colors = {
        violet: 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300',
        emerald: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
        amber: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
        red: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
        sky: 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300',
        rose: 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300',
    };
    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${colors[color] || colors.violet}`}>
            {children}
        </span>
    );
}

function Toast({ message, type = 'success', onClose }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`toast ${type === 'success' ? 'toast-success' : 'toast-error'}`}>
            {message}
        </div>
    );
}

// ─── Constants ───────────────────────────────────────────────

const CATEGORIAS = [
    { value: 'alimentacao', label: '🍔 Alimentação', color: 'amber' },
    { value: 'transporte', label: '🚗 Transporte', color: 'sky' },
    { value: 'hospedagem', label: '🏨 Hospedagem', color: 'violet' },
    { value: 'lazer', label: '🎉 Lazer', color: 'emerald' },
    { value: 'compras', label: '🛍️ Compras', color: 'rose' },
    { value: 'outros', label: '📦 Outros', color: 'red' },
];

const getCategoriaInfo = (value) => CATEGORIAS.find((c) => c.value === value) || CATEGORIAS[5];

const formatarMoeda = (valor) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);

const formatarData = (data) => {
    if (!data) return '';
    const d = new Date(data + 'T00:00:00');
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
};

// ─── Main App ────────────────────────────────────────────────

export default function App() {
    // Data state
    const [participantes, setParticipantes] = useState([]);
    const [despesas, setDespesas] = useState([]);

    // UI state
    const [view, setView] = useState('dashboard');
    const [darkMode, setDarkMode] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('contacerta-dark') === 'true';
        }
        return false;
    });

    // Loading / Error / Toast
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);

    // Modals
    const [showDespesaModal, setShowDespesaModal] = useState(false);
    const [showParticipanteModal, setShowParticipanteModal] = useState(false);
    const [editingDespesa, setEditingDespesa] = useState(null);
    const [novoParticipante, setNovoParticipante] = useState('');

    // Filters
    const [filters, setFilters] = useState({ dataInicio: '', dataFim: '', categoria: '', participante: '' });
    const [sortBy, setSortBy] = useState('data');
    const [sortOrder, setSortOrder] = useState('desc');

    // ─── Dark Mode ────────────────────────────────────────────

    useEffect(() => {
        document.documentElement.classList.toggle('dark', darkMode);
        localStorage.setItem('contacerta-dark', darkMode);
    }, [darkMode]);

    // ─── Data Loading from Supabase ───────────────────────────

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const [parts, exps] = await Promise.all([
                getParticipantes(),
                getDespesas(),
            ]);
            setParticipantes(parts);
            setDespesas(exps);
        } catch (err) {
            console.error('Erro ao carregar dados:', err);
            setToast({ message: 'Erro ao carregar dados do servidor', type: 'error' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // ─── Participant Handlers ─────────────────────────────────

    const handleAddParticipante = async () => {
        const nome = novoParticipante.trim();
        if (!nome) return;
        try {
            setSaving(true);
            const novo = await addParticipante(nome);
            setParticipantes((prev) => [...prev, novo]);
            setNovoParticipante('');
            setShowParticipanteModal(false);
            setToast({ message: `${nome} adicionado!`, type: 'success' });
        } catch (err) {
            console.error(err);
            setToast({ message: 'Erro ao adicionar participante', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteParticipante = async (id) => {
        const temDespesa = despesas.some((d) => d.pagador === id);
        if (temDespesa) {
            setToast({ message: 'Remova as despesas deste participante primeiro', type: 'error' });
            return;
        }
        try {
            setSaving(true);
            await deleteParticipante(id);
            setParticipantes((prev) => prev.filter((p) => p.id !== id));
            setToast({ message: 'Participante removido', type: 'success' });
        } catch (err) {
            console.error(err);
            setToast({ message: 'Erro ao remover participante', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    // ─── Expense Handlers ─────────────────────────────────────

    const handleSaveDespesa = async (despesa) => {
        try {
            setSaving(true);
            if (editingDespesa) {
                const updated = await updateDespesa(editingDespesa.id, despesa);
                setDespesas((prev) => prev.map((d) => (d.id === editingDespesa.id ? updated : d)));
                setToast({ message: 'Despesa atualizada!', type: 'success' });
            } else {
                const nova = await addDespesa(despesa);
                setDespesas((prev) => [nova, ...prev]);
                setToast({ message: 'Despesa adicionada!', type: 'success' });
            }
            setShowDespesaModal(false);
            setEditingDespesa(null);
        } catch (err) {
            console.error(err);
            setToast({ message: 'Erro ao salvar despesa', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteDespesa = async (id) => {
        try {
            setSaving(true);
            await deleteDespesa(id);
            setDespesas((prev) => prev.filter((d) => d.id !== id));
            setToast({ message: 'Despesa removida', type: 'success' });
        } catch (err) {
            console.error(err);
            setToast({ message: 'Erro ao remover despesa', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    // ─── Balance Calculation ──────────────────────────────────

    const calcularBalanco = useMemo(() => {
        const balanco = {};
        participantes.forEach((p) => {
            balanco[p.id] = { nome: p.nome, pagou: 0, deve: 0 };
        });

        despesas.forEach((d) => {
            if (balanco[d.pagador]) {
                balanco[d.pagador].pagou += d.valor;
            }

            const envolvidos = d.divisao?.envolvidos || [];
            if (envolvidos.length === 0) return;

            if (d.divisao.tipo === 'igual') {
                const valorPorPessoa = d.valor / envolvidos.length;
                envolvidos.forEach((pid) => {
                    if (balanco[pid]) balanco[pid].deve += valorPorPessoa;
                });
            } else if (d.divisao.tipo === 'porcentagem') {
                envolvidos.forEach((pid) => {
                    const pct = d.divisao.valores?.[pid] || 0;
                    if (balanco[pid]) balanco[pid].deve += (d.valor * pct) / 100;
                });
            } else if (d.divisao.tipo === 'personalizado') {
                envolvidos.forEach((pid) => {
                    const val = d.divisao.valores?.[pid] || 0;
                    if (balanco[pid]) balanco[pid].deve += val;
                });
            }
        });

        return balanco;
    }, [participantes, despesas]);

    const simplificarDividas = useMemo(() => {
        const saldos = Object.entries(calcularBalanco).map(([id, b]) => ({
            id,
            nome: b.nome,
            saldo: parseFloat((b.pagou - b.deve).toFixed(2)),
        }));

        const devedores = saldos.filter((s) => s.saldo < 0).sort((a, b) => a.saldo - b.saldo);
        const credores = saldos.filter((s) => s.saldo > 0).sort((a, b) => b.saldo - a.saldo);

        const transacoes = [];
        let i = 0;
        let j = 0;

        while (i < devedores.length && j < credores.length) {
            const valor = Math.min(-devedores[i].saldo, credores[j].saldo);
            if (valor > 0.01) {
                transacoes.push({
                    de: devedores[i].nome,
                    para: credores[j].nome,
                    valor: parseFloat(valor.toFixed(2)),
                });
            }
            devedores[i].saldo += valor;
            credores[j].saldo -= valor;
            if (Math.abs(devedores[i].saldo) < 0.01) i++;
            if (Math.abs(credores[j].saldo) < 0.01) j++;
        }

        return transacoes;
    }, [calcularBalanco]);

    // ─── Filtered & Sorted Expenses ───────────────────────────

    const despesasFiltradas = useMemo(() => {
        let result = [...despesas];

        if (filters.dataInicio) result = result.filter((d) => d.data >= filters.dataInicio);
        if (filters.dataFim) result = result.filter((d) => d.data <= filters.dataFim);
        if (filters.categoria) result = result.filter((d) => d.categoria === filters.categoria);
        if (filters.participante) result = result.filter((d) => d.pagador === filters.participante);

        result.sort((a, b) => {
            let cmp = 0;
            if (sortBy === 'data') cmp = a.data.localeCompare(b.data);
            else cmp = a.valor - b.valor;
            return sortOrder === 'asc' ? cmp : -cmp;
        });

        return result;
    }, [despesas, filters, sortBy, sortOrder]);

    // ─── Stats ────────────────────────────────────────────────

    const stats = useMemo(() => {
        const total = despesas.reduce((s, d) => s + d.valor, 0);
        const media = participantes.length > 0 ? total / participantes.length : 0;
        const maior = despesas.length > 0 ? Math.max(...despesas.map((d) => d.valor)) : 0;
        return { total, media, maior };
    }, [despesas, participantes]);

    const categoriaTotais = useMemo(() => {
        const totais = {};
        despesas.forEach((d) => {
            totais[d.categoria] = (totais[d.categoria] || 0) + d.valor;
        });
        return Object.entries(totais)
            .map(([cat, val]) => ({ ...getCategoriaInfo(cat), total: val }))
            .sort((a, b) => b.total - a.total);
    }, [despesas]);

    // ─── CSV Export ───────────────────────────────────────────

    const exportarCSV = () => {
        const rows = [['Descrição', 'Valor', 'Pagador', 'Data', 'Categoria', 'Divisão']];
        despesas.forEach((d) => {
            const pagador = participantes.find((p) => p.id === d.pagador)?.nome || '';
            rows.push([d.descricao, d.valor, pagador, d.data, d.categoria, d.divisao.tipo]);
        });

        rows.push([]);
        rows.push(['--- SALDOS ---']);
        Object.entries(calcularBalanco).forEach(([, b]) => {
            rows.push([b.nome, `Pagou: ${b.pagou.toFixed(2)}`, `Deve: ${b.deve.toFixed(2)}`, `Saldo: ${(b.pagou - b.deve).toFixed(2)}`]);
        });

        rows.push([]);
        rows.push(['--- ACERTOS ---']);
        simplificarDividas.forEach((t) => {
            rows.push([`${t.de} → ${t.para}`, t.valor.toFixed(2)]);
        });

        const csv = rows.map((r) => r.join(';')).join('\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `contacerta_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // ─── Pie Chart ────────────────────────────────────────────

    const PieChart = ({ data }) => {
        if (data.length === 0) return null;
        const total = data.reduce((s, d) => s + d.total, 0);
        const pieColors = ['#8b5cf6', '#10b981', '#f59e0b', '#0ea5e9', '#f43f5e', '#ef4444'];
        let cumAngle = 0;

        return (
            <div className="flex items-center gap-6">
                <svg viewBox="0 0 100 100" className="w-32 h-32 flex-shrink-0">
                    {data.map((item, idx) => {
                        const pct = item.total / total;
                        const angle = pct * 360;
                        const startAngle = cumAngle;
                        cumAngle += angle;

                        const start = polarToCartesian(50, 50, 40, startAngle);
                        const end = polarToCartesian(50, 50, 40, startAngle + angle);
                        const largeArc = angle > 180 ? 1 : 0;

                        if (data.length === 1) {
                            return <circle key={idx} cx="50" cy="50" r="40" fill={pieColors[idx % pieColors.length]} />;
                        }

                        return (
                            <path
                                key={idx}
                                d={`M 50 50 L ${start.x} ${start.y} A 40 40 0 ${largeArc} 1 ${end.x} ${end.y} Z`}
                                fill={pieColors[idx % pieColors.length]}
                            />
                        );
                    })}
                    <circle cx="50" cy="50" r="22" className="fill-white dark:fill-gray-900" />
                </svg>
                <div className="flex flex-col gap-1.5 text-sm">
                    {data.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: pieColors[idx % pieColors.length] }} />
                            <span className="text-gray-600 dark:text-gray-400 truncate">{item.label.split(' ')[1]}</span>
                            <span className="font-semibold ml-auto">{((item.total / total) * 100).toFixed(0)}%</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // ─── Loading Screen ───────────────────────────────────────

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
                <div className="text-center space-y-4">
                    <Loader2 className="w-10 h-10 text-violet-500 animate-spin mx-auto" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">Carregando ContaCerta...</p>
                </div>
            </div>
        );
    }

    // ─── RENDER ───────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
            {/* Toast */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Saving overlay */}
            {saving && (
                <div className="loading-overlay">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl flex items-center gap-3">
                        <Loader2 className="w-5 h-5 text-violet-500 animate-spin" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Salvando...</span>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800">
                <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
                    <h1 className="text-xl font-extrabold bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-transparent">
                        ContaCerta
                    </h1>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={exportarCSV}>
                            <Download className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDarkMode(!darkMode)}>
                            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        </Button>
                    </div>
                </div>
            </header>

            {/* Tab Navigation */}
            <nav className="max-w-4xl mx-auto px-4 pt-4">
                <div className="flex gap-1 bg-gray-100 dark:bg-gray-900 p-1 rounded-xl">
                    {[
                        { key: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
                        { key: 'despesas', icon: Receipt, label: 'Despesas' },
                        { key: 'participantes', icon: Users, label: 'Pessoas' },
                    ].map(({ key, icon: Icon, label }) => (
                        <button
                            key={key}
                            onClick={() => setView(key)}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${view === key
                                    ? 'bg-white dark:bg-gray-800 text-violet-600 dark:text-violet-400 shadow-sm'
                                    : 'text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            <span className="hidden sm:inline">{label}</span>
                        </button>
                    ))}
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-24">
                {/* ─── DASHBOARD VIEW ──────────────────────────────── */}
                {view === 'dashboard' && (
                    <div className="space-y-6 animate-in">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <Card>
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-violet-100 dark:bg-violet-900/40 rounded-xl">
                                        <DollarSign className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Total Gasto</p>
                                        <p className="text-lg font-bold">{formatarMoeda(stats.total)}</p>
                                    </div>
                                </div>
                            </Card>
                            <Card>
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl">
                                        <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Média/Pessoa</p>
                                        <p className="text-lg font-bold">{formatarMoeda(stats.media)}</p>
                                    </div>
                                </div>
                            </Card>
                            <Card>
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-amber-100 dark:bg-amber-900/40 rounded-xl">
                                        <PieChartIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Maior Despesa</p>
                                        <p className="text-lg font-bold">{formatarMoeda(stats.maior)}</p>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Category Breakdown */}
                        {categoriaTotais.length > 0 && (
                            <Card>
                                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Por Categoria</h3>
                                <PieChart data={categoriaTotais} />
                            </Card>
                        )}

                        {/* Settlement */}
                        <Card>
                            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                                💸 Acertar Contas
                            </h3>
                            {simplificarDividas.length === 0 ? (
                                <p className="text-gray-400 dark:text-gray-600 text-sm text-center py-4">
                                    Tudo acertado! ✨
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {simplificarDividas.map((t, i) => (
                                        <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                                            <span className="font-semibold text-sm text-red-500">{t.de}</span>
                                            <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                            <span className="font-semibold text-sm text-emerald-500">{t.para}</span>
                                            <span className="ml-auto font-bold text-sm">{formatarMoeda(t.valor)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>

                        {/* Per-person balance */}
                        {participantes.length > 0 && (
                            <Card>
                                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                                    Saldo Individual
                                </h3>
                                <div className="space-y-2">
                                    {Object.entries(calcularBalanco).map(([id, b]) => {
                                        const saldo = b.pagou - b.deve;
                                        return (
                                            <div key={id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                                                <span className="font-medium text-sm">{b.nome}</span>
                                                <div className="flex items-center gap-4 text-xs">
                                                    <span className="text-gray-500">Pagou: {formatarMoeda(b.pagou)}</span>
                                                    <span className="text-gray-500">Deve: {formatarMoeda(b.deve)}</span>
                                                    <span className={`font-bold ${saldo >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                                        {saldo >= 0 ? '+' : ''}{formatarMoeda(saldo)}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </Card>
                        )}
                    </div>
                )}

                {/* ─── EXPENSES VIEW ───────────────────────────────── */}
                {view === 'despesas' && (
                    <div className="space-y-4 animate-in">
                        {/* Action bar */}
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold">Despesas</h2>
                            <Button onClick={() => { setEditingDespesa(null); setShowDespesaModal(true); }} disabled={participantes.length === 0}>
                                <Plus className="w-4 h-4" /> Nova
                            </Button>
                        </div>

                        {participantes.length === 0 && (
                            <Card className="text-center py-8">
                                <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                                <p className="text-sm text-gray-500">Adicione participantes primeiro para criar despesas.</p>
                            </Card>
                        )}

                        {/* Filters */}
                        {despesas.length > 0 && (
                            <Card className="space-y-3">
                                <div className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                                    <Filter className="w-4 h-4" /> Filtros
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <Input type="date" value={filters.dataInicio} onChange={(e) => setFilters({ ...filters, dataInicio: e.target.value })} placeholder="De" />
                                    <Input type="date" value={filters.dataFim} onChange={(e) => setFilters({ ...filters, dataFim: e.target.value })} placeholder="Até" />
                                    <Select value={filters.categoria} onChange={(e) => setFilters({ ...filters, categoria: e.target.value })}>
                                        <option value="">Todas categorias</option>
                                        {CATEGORIAS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                                    </Select>
                                    <Select value={filters.participante} onChange={(e) => setFilters({ ...filters, participante: e.target.value })}>
                                        <option value="">Todos participantes</option>
                                        {participantes.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
                                    </Select>
                                </div>
                                <div className="flex items-center gap-3 text-xs">
                                    <button
                                        onClick={() => setSortBy(sortBy === 'data' ? 'valor' : 'data')}
                                        className="flex items-center gap-1 text-gray-500 hover:text-violet-500 transition-colors"
                                    >
                                        <ArrowUpDown className="w-3 h-3" />
                                        {sortBy === 'data' ? 'Data' : 'Valor'}
                                    </button>
                                    <button
                                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                                        className="text-gray-500 hover:text-violet-500 transition-colors"
                                    >
                                        {sortOrder === 'asc' ? '↑ Crescente' : '↓ Decrescente'}
                                    </button>
                                    {(filters.dataInicio || filters.dataFim || filters.categoria || filters.participante) && (
                                        <button
                                            onClick={() => setFilters({ dataInicio: '', dataFim: '', categoria: '', participante: '' })}
                                            className="text-red-500 hover:text-red-600 ml-auto"
                                        >
                                            Limpar filtros
                                        </button>
                                    )}
                                </div>
                            </Card>
                        )}

                        {/* Expense List */}
                        <div className="space-y-3">
                            {despesasFiltradas.map((d) => {
                                const catInfo = getCategoriaInfo(d.categoria);
                                const pagadorNome = participantes.find((p) => p.id === d.pagador)?.nome || '—';
                                return (
                                    <Card key={d.id} className="hover:shadow-md transition-shadow">
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-1 flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-semibold text-sm truncate">{d.descricao}</h4>
                                                    <Badge color={catInfo.color}>{catInfo.label}</Badge>
                                                </div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    Pago por <span className="font-semibold">{pagadorNome}</span> • {formatarData(d.data)}
                                                    {' '}• {d.divisao.tipo === 'igual' ? 'Divisão igual' : d.divisao.tipo === 'porcentagem' ? 'Por %' : 'Personalizado'}
                                                    {d.divisao.envolvidos && ` (${d.divisao.envolvidos.length}p)`}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 ml-3">
                                                <span className="text-base font-bold whitespace-nowrap">{formatarMoeda(d.valor)}</span>
                                                <Button variant="ghost" size="sm" onClick={() => { setEditingDespesa(d); setShowDespesaModal(true); }}>
                                                    <Edit3 className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => handleDeleteDespesa(d.id)}>
                                                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })}
                            {despesasFiltradas.length === 0 && despesas.length > 0 && (
                                <p className="text-center text-gray-400 dark:text-gray-600 text-sm py-8">
                                    Nenhuma despesa encontrada com esses filtros.
                                </p>
                            )}
                            {despesas.length === 0 && participantes.length > 0 && (
                                <Card className="text-center py-8">
                                    <Receipt className="w-8 h-8 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
                                    <p className="text-sm text-gray-400">Nenhuma despesa registrada ainda.</p>
                                </Card>
                            )}
                        </div>
                    </div>
                )}

                {/* ─── PARTICIPANTS VIEW ──────────────────────────── */}
                {view === 'participantes' && (
                    <div className="space-y-4 animate-in">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold">Participantes ({participantes.length})</h2>
                            <Button onClick={() => setShowParticipanteModal(true)}>
                                <Plus className="w-4 h-4" /> Adicionar
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {participantes.map((p) => {
                                const bal = calcularBalanco[p.id];
                                const saldo = bal ? bal.pagou - bal.deve : 0;
                                return (
                                    <Card key={p.id} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-sm">
                                                {p.nome.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-sm">{p.nome}</p>
                                                <p className={`text-xs font-medium ${saldo >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                                    {saldo >= 0 ? 'Recebe' : 'Deve'} {formatarMoeda(Math.abs(saldo))}
                                                </p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => handleDeleteParticipante(p.id)}>
                                            <Trash2 className="w-4 h-4 text-red-400" />
                                        </Button>
                                    </Card>
                                );
                            })}
                        </div>

                        {participantes.length === 0 && (
                            <Card className="text-center py-12">
                                <Users className="w-10 h-10 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                                <p className="text-gray-500 text-sm">Adicione pessoas para começar a dividir despesas.</p>
                            </Card>
                        )}
                    </div>
                )}
            </main>

            {/* ─── EXPENSE MODAL ─────────────────────────────────── */}
            {showDespesaModal && (
                <DespesaModal
                    participantes={participantes}
                    editingDespesa={editingDespesa}
                    onSave={handleSaveDespesa}
                    onClose={() => { setShowDespesaModal(false); setEditingDespesa(null); }}
                />
            )}

            {/* ─── PARTICIPANT MODAL ─────────────────────────────── */}
            {showParticipanteModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowParticipanteModal(false)}>
                    <Card className="w-full max-w-sm animate-slide-up" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold">Novo Participante</h3>
                            <Button variant="ghost" size="sm" onClick={() => setShowParticipanteModal(false)}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="space-y-4">
                            <Input
                                label="Nome"
                                value={novoParticipante}
                                onChange={(e) => setNovoParticipante(e.target.value)}
                                placeholder="Ex: Maria"
                                onKeyDown={(e) => e.key === 'Enter' && handleAddParticipante()}
                                autoFocus
                            />
                            <Button onClick={handleAddParticipante} disabled={!novoParticipante.trim()} className="w-full">
                                Adicionar
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}

// ─── Expense Modal Component ─────────────────────────────────

function DespesaModal({ participantes, editingDespesa, onSave, onClose }) {
    const [form, setForm] = useState(() => {
        if (editingDespesa) {
            return {
                descricao: editingDespesa.descricao,
                valor: editingDespesa.valor.toString(),
                pagador: editingDespesa.pagador,
                data: editingDespesa.data,
                categoria: editingDespesa.categoria,
                tipoDivisao: editingDespesa.divisao.tipo,
                envolvidos: editingDespesa.divisao.envolvidos || [],
                valores: editingDespesa.divisao.valores || {},
            };
        }
        return {
            descricao: '',
            valor: '',
            pagador: participantes[0]?.id || '',
            data: new Date().toISOString().slice(0, 10),
            categoria: 'outros',
            tipoDivisao: 'igual',
            envolvidos: participantes.map((p) => p.id),
            valores: {},
        };
    });

    const handleSubmit = () => {
        if (!form.descricao.trim() || !form.valor || !form.pagador || !form.data) return;
        onSave({
            descricao: form.descricao.trim(),
            valor: parseFloat(form.valor),
            pagador: form.pagador,
            data: form.data,
            categoria: form.categoria,
            divisao: {
                tipo: form.tipoDivisao,
                envolvidos: form.envolvidos,
                valores: form.tipoDivisao !== 'igual' ? form.valores : undefined,
            },
        });
    };

    const toggleEnvolvido = (id) => {
        setForm((prev) => ({
            ...prev,
            envolvidos: prev.envolvidos.includes(id)
                ? prev.envolvidos.filter((x) => x !== id)
                : [...prev.envolvidos, id],
        }));
    };

    const setValorEnvolvido = (id, val) => {
        setForm((prev) => ({
            ...prev,
            valores: { ...prev.valores, [id]: parseFloat(val) || 0 },
        }));
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-bold">{editingDespesa ? 'Editar Despesa' : 'Nova Despesa'}</h3>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                <div className="space-y-4">
                    <Input
                        label="Descrição"
                        value={form.descricao}
                        onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                        placeholder="Ex: Almoço no restaurante"
                        autoFocus
                    />

                    <div className="grid grid-cols-2 gap-3">
                        <Input
                            label="Valor (R$)"
                            type="number"
                            step="0.01"
                            min="0"
                            value={form.valor}
                            onChange={(e) => setForm({ ...form, valor: e.target.value })}
                            placeholder="0,00"
                        />
                        <Input
                            label="Data"
                            type="date"
                            value={form.data}
                            onChange={(e) => setForm({ ...form, data: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Select label="Quem pagou?" value={form.pagador} onChange={(e) => setForm({ ...form, pagador: e.target.value })}>
                            {participantes.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
                        </Select>
                        <Select label="Categoria" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
                            {CATEGORIAS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </Select>
                    </div>

                    {/* Division Type */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de Divisão</label>
                        <div className="flex gap-2">
                            {[
                                { value: 'igual', label: 'Igual' },
                                { value: 'porcentagem', label: '%' },
                                { value: 'personalizado', label: 'R$' },
                            ].map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => setForm({ ...form, tipoDivisao: opt.value, valores: {} })}
                                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${form.tipoDivisao === opt.value
                                            ? 'bg-violet-600 text-white shadow-md'
                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Participants Selection */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Dividir entre</label>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {participantes.map((p) => {
                                const isSelected = form.envolvidos.includes(p.id);
                                return (
                                    <div key={p.id} className="flex items-center gap-3">
                                        <button
                                            onClick={() => toggleEnvolvido(p.id)}
                                            className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${isSelected
                                                    ? 'bg-violet-600 border-violet-600 text-white'
                                                    : 'border-gray-300 dark:border-gray-600'
                                                }`}
                                        >
                                            {isSelected && '✓'}
                                        </button>
                                        <span className="text-sm flex-1">{p.nome}</span>
                                        {isSelected && form.tipoDivisao === 'igual' && form.envolvidos.length > 0 && (
                                            <span className="text-xs text-gray-400 font-medium">
                                                {formatarMoeda((parseFloat(form.valor) || 0) / form.envolvidos.length)}
                                            </span>
                                        )}
                                        {isSelected && form.tipoDivisao === 'porcentagem' && (
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                step="1"
                                                value={form.valores[p.id] || ''}
                                                onChange={(e) => setValorEnvolvido(p.id, e.target.value)}
                                                placeholder="%"
                                                className="w-20 px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-right"
                                            />
                                        )}
                                        {isSelected && form.tipoDivisao === 'personalizado' && (
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={form.valores[p.id] || ''}
                                                onChange={(e) => setValorEnvolvido(p.id, e.target.value)}
                                                placeholder="R$"
                                                className="w-24 px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-right"
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <Button onClick={handleSubmit} className="w-full" disabled={!form.descricao.trim() || !form.valor || !form.pagador}>
                        {editingDespesa ? 'Salvar Alterações' : 'Adicionar Despesa'}
                    </Button>
                </div>
            </Card>
        </div>
    );
}

// ─── Utility ─────────────────────────────────────────────────

function polarToCartesian(cx, cy, r, angleDeg) {
    const angleRad = ((angleDeg - 90) * Math.PI) / 180;
    return {
        x: cx + r * Math.cos(angleRad),
        y: cy + r * Math.sin(angleRad),
    };
}

import { useState, useEffect } from 'react';
import { getGroups, createGroup } from '../lib/database';
import { Plus, ChevronDown, Check, FolderPlus, Loader2, X } from 'lucide-react';

export function GroupManager({ currentGroup, onGroupChange }) {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [creating, setCreating] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        loadGroups();
    }, []);

    const loadGroups = async () => {
        try {
            setLoading(true);
            const data = await getGroups();
            setGroups(data);

            // Auto-select first group if none selected and groups exist
            if (!currentGroup && data.length > 0) {
                onGroupChange(data[0]);
            } else if (!currentGroup && data.length === 0) {
                // Prompt creation if no groups
                setIsCreating(true);
            }
        } catch (error) {
            console.error('Error loading groups:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateGroup = async (e) => {
        e.preventDefault();
        if (!newGroupName.trim()) return;

        try {
            setCreating(true);
            const newGroup = await createGroup(newGroupName.trim());
            setGroups(prev => [...prev, newGroup]);
            onGroupChange(newGroup);
            setIsCreating(false);
            setNewGroupName('');
            setIsOpen(false);
        } catch (error) {
            console.error('Error creating group:', error);
            alert('Erro ao criar grupo');
        } finally {
            setCreating(false);
        }
    };

    if (loading && groups.length === 0) {
        return <div className="text-white/50 text-sm flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Carregando grupos...</div>;
    }

    if (groups.length === 0 && !loading) {
        return (
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-2 bg-emerald-500/20 text-emerald-300 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-emerald-500/30 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Criar Primeiro Grupo
                </button>
                {isCreating && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-sm w-full p-6 shadow-2xl">
                            <h3 className="text-lg font-bold text-white mb-2">Criar Novo Grupo</h3>
                            <p className="text-slate-400 text-sm mb-4">Dê um nome para identificar suas contas (ex: "Viagem Carnaval", "Casa", "Churrasco").</p>
                            <form onSubmit={handleCreateGroup} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Nome do Grupo</label>
                                    <input
                                        type="text"
                                        value={newGroupName}
                                        onChange={e => setNewGroupName(e.target.value)}
                                        className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                                        placeholder="Ex: Viagem 2024"
                                        autoFocus
                                    />
                                </div>
                                <div className="flex justify-end gap-3 pt-2">
                                    <button
                                        type="submit"
                                        disabled={creating || !newGroupName.trim()}
                                        className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium py-2.5 rounded-lg hover:from-emerald-600 hover:to-teal-600 focus:ring-4 focus:ring-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                                    >
                                        {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderPlus className="w-4 h-4" />}
                                        Criar Grupo
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 px-3 py-1.5 rounded-lg text-sm font-medium transition-all group"
            >
                <span className="opacity-70 text-xs uppercase tracking-wider font-semibold">Grupo:</span>
                <span className="text-emerald-600 dark:text-emerald-400 truncate max-w-[150px]">{currentGroup ? currentGroup.name : 'Selecionar...'}</span>
                <ChevronDown className={`w-4 h-4 text-gray-500 dark:text-white/50 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700/50 rounded-xl shadow-2xl z-50 overflow-hidden ring-1 ring-black/5 dark:ring-white/10">
                        <div className="flex items-center justify-between p-2 border-b border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-slate-950/50">
                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-2">Selecione um grupo</span>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1 hover:bg-gray-200 dark:hover:bg-white/10 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-2 max-h-60 overflow-y-auto space-y-1 custom-scrollbar">
                            {groups.map(group => (
                                <button
                                    key={group.id}
                                    onClick={() => {
                                        onGroupChange(group);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${currentGroup?.id === group.id
                                        ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-medium'
                                        : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
                                        }`}
                                >
                                    <span className="truncate">{group.name}</span>
                                    {currentGroup?.id === group.id && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                                </button>
                            ))}
                        </div>
                        <div className="p-2 border-t border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-slate-950/50">
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    setIsCreating(true);
                                }}
                                className="w-full flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 px-3 py-2 rounded-lg transition-all border border-dashed border-gray-300 dark:border-slate-700 hover:border-emerald-500/50"
                            >
                                <Plus className="w-4 h-4" />
                                Novo Grupo
                            </button>
                        </div>
                    </div>
                </>
            )}

            {isCreating && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-sm w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-white">Criar Novo Grupo</h3>
                            <button onClick={() => setIsCreating(false)} className="text-slate-500 hover:text-white transition-colors">
                                <Plus className="w-5 h-5 rotate-45" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateGroup} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Nome do Grupo</label>
                                <input
                                    type="text"
                                    value={newGroupName}
                                    onChange={e => setNewGroupName(e.target.value)}
                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                                    placeholder="Ex: Churrasco do FDS"
                                    autoFocus
                                />
                            </div>
                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={creating || !newGroupName.trim()}
                                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium py-2.5 rounded-lg hover:from-emerald-600 hover:to-teal-600 focus:ring-4 focus:ring-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                                >
                                    {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderPlus className="w-4 h-4" />}
                                    Criar Grupo
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

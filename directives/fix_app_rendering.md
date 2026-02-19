# Fix App Rendering Directive

## Goal
Fix the syntax error in `App.jsx` caused by a corrupted `PagamentoModal` component definition. The component's render logic was accidentally merged into its `handleSubmit` function due to a bad replacement.

## Input
- Error Message: `Unexpected token (1002:20)` at `</div >`.
- Corrupted File: `c:\Users\Letícia\contacerta\app\src\App.jsx`

## Analysis
The `PagamentoModal` component definition (lines ~983-1007) is malformed. The `onSave` function call inside `handleSubmit` is immediately followed by closing JSX tags, missing the rest of the logic and the component's `return` statement.

## Plan
1.  **Read** the corrupted `PagamentoModal` code to confirm exact start/end lines.
2.  **Replace** the entire `PagamentoModal` function with the correct implementation.
    - Ensure `handleSubmit` logic is complete.
    - Ensure `return (...)` JSX block is present and matched.
3.  **Verify** the fix by checking if `DebtAccordionItem` (which follows it) is still intact.

## Proposed Code (PagamentoModal)
```javascript
function PagamentoModal({ participantes, onSave, onClose }) {
    const [pagadorId, setPagadorId] = useState('');
    const [recebedorId, setRecebedorId] = useState('');
    const [valor, setValor] = useState('');
    const [data, setData] = useState(new Date().toISOString().slice(0, 10));

    const handleSubmit = () => {
        if (!pagadorId || !recebedorId || !valor) {
            alert('Preencha todos os campos!');
            return;
        }
        if (pagadorId === recebedorId) {
            alert('Pagador e Recebedor não podem ser a mesma pessoa.');
            return;
        }
        onSave({
            pagador_id: pagadorId,
            recebedor_id: recebedorId,
            valor: parseFloat(valor),
            data
        });
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md animate-slide-up">
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-bold">Registrar Pagamento</h3>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                <div className="space-y-4">
                    <Select
                        label="Quem pagou?"
                        value={pagadorId}
                        onChange={(e) => setPagadorId(e.target.value)}
                    >
                        <option value="">Selecione...</option>
                        {participantes.map(p => (
                            <option key={p.id} value={p.id}>{p.nome}</option>
                        ))}
                    </Select>

                    <div className="flex justify-center">
                        <ArrowRight className="w-6 h-6 text-gray-400 rotate-90 my-1" />
                    </div>

                    <Select
                        label="Para quem?"
                        value={recebedorId}
                        onChange={(e) => setRecebedorId(e.target.value)}
                    >
                        <option value="">Selecione...</option>
                        {participantes.map(p => (
                            <option key={p.id} value={p.id}>{p.nome}</option>
                        ))}
                    </Select>

                    <div className="grid grid-cols-2 gap-3">
                        <Input
                            label="Valor (R$)"
                            type="number"
                            step="0.01"
                            min="0"
                            value={valor}
                            onChange={(e) => setValor(e.target.value)}
                            placeholder="0,00"
                        />
                         <Input
                            label="Data"
                            type="date"
                            value={data}
                            onChange={(e) => setData(e.target.value)}
                        />
                    </div>

                    <Button onClick={handleSubmit} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                        Confirmar Pagamento
                    </Button>
                </div>
            </Card>
        </div>
    );
}
```

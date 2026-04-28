import type { LRTables } from '@/lib/lr-parser';

interface Props {
  tables: LRTables;
  mode: 'LR0' | 'SLR1';
}

function actionLabel(a: { type: string; target?: number }): string {
  switch (a.type) {
    case 'shift': return `s${a.target}`;
    case 'reduce': return `r${a.target}`;
    case 'accept': return 'acc';
    default: return '';
  }
}

export function LRTable({ tables, mode }: Props) {
  const terminals = tables.terminals;
  const nonTerminals = tables.nonTerminals.filter(nt => nt !== tables.augmentedStart);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <h3 className="font-mono text-sm font-semibold tracking-tight">{mode === 'LR0' ? 'LR(0)' : 'SLR(1)'} Parsing Table</h3>
        {tables.hasConflicts && (
          <span className="text-xs font-mono px-2 py-0.5 bg-conflict text-conflict-foreground rounded-sm">
            ● Conflicts: {tables.conflictDetails.length}
          </span>
        )}
      </div>
      <div className="overflow-x-auto border border-border rounded-md">
        <table className="w-full text-xs font-mono tabular-nums">
          <thead>
            <tr className="bg-secondary">
              <th rowSpan={2} className="px-3 py-2 border-r border-border font-semibold">State</th>
              <th colSpan={terminals.length} className="px-3 py-1 border-r border-b border-border font-semibold text-center">ACTION</th>
              <th colSpan={Math.max(nonTerminals.length, 1)} className="px-3 py-1 border-b border-border font-semibold text-center">GOTO</th>
            </tr>
            <tr className="bg-secondary">
              {terminals.map(t => (
                <th key={t} className="px-2 py-1 text-center border-r border-border font-semibold min-w-[50px]">{t}</th>
              ))}
              {nonTerminals.map(nt => (
                <th key={nt} className="px-2 py-1 text-center border-r border-border last:border-r-0 font-semibold min-w-[50px]">{nt}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tables.states.map(st => (
              <tr key={st.id} className="border-t border-border">
                <td className="px-3 py-1.5 bg-secondary font-semibold border-r border-border text-center">{st.id}</td>
                {terminals.map(t => {
                  const a = tables.action.get(st.id)?.get(t);
                  const conflict = a?.conflicting;
                  return (
                    <td key={t} className={`px-2 py-1.5 text-center border-r border-border ${conflict ? 'bg-conflict text-conflict-foreground' : ''}`}>
                      {a ? (
                        <span>
                          {actionLabel(a)}
                          {conflict && <span className="text-destructive ml-0.5">●</span>}
                        </span>
                      ) : <span className="text-muted-foreground/30">—</span>}
                    </td>
                  );
                })}
                {nonTerminals.map(nt => {
                  const g = tables.gotoTable.get(st.id)?.get(nt);
                  return (
                    <td key={nt} className="px-2 py-1.5 text-center border-r border-border last:border-r-0">
                      {g !== undefined ? g : <span className="text-muted-foreground/30">—</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-mono text-muted-foreground">
        {tables.flatProductions.map(p => (
          <span key={p.index}><span className="text-foreground">({p.index})</span> {p.lhs} → {p.rhs.join(' ') || 'ε'}</span>
        ))}
      </div>
    </div>
  );
}

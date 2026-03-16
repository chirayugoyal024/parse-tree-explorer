import type { ParseTable } from '@/lib/ll1-parser';

interface LL1TableProps {
  table: ParseTable | null;
  terminals: string[];
  nonTerminals: string[];
  hasConflicts: boolean;
}

export function LL1Table({ table, terminals, nonTerminals, hasConflicts }: LL1TableProps) {
  if (!table || nonTerminals.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <h3 className="font-mono text-sm font-semibold tracking-tight">LL(1) Parsing Table</h3>
        {hasConflicts && (
          <span className="text-xs font-mono px-2 py-0.5 bg-conflict text-conflict-foreground rounded-sm">
            ● Conflicts detected
          </span>
        )}
      </div>
      <div className="overflow-x-auto border border-border rounded-md">
        <table className="w-full text-xs font-mono tabular-nums">
          <thead>
            <tr className="bg-secondary">
              <th className="px-3 py-2 text-left border-r border-border font-semibold"></th>
              {terminals.map(t => (
                <th key={t} className="px-3 py-2 text-center border-r border-border last:border-r-0 font-semibold min-w-[70px]">
                  {t}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {nonTerminals.map(nt => (
              <tr key={nt} className="border-t border-border">
                <td className="px-3 py-2 bg-secondary font-semibold border-r border-border">{nt}</td>
                {terminals.map(t => {
                  const entry = table.get(nt)?.get(t);
                  const isConflict = entry?.conflicting;
                  return (
                    <td
                      key={t}
                      className={`px-3 py-2 text-center border-r border-border last:border-r-0 ${
                        isConflict ? 'bg-conflict text-conflict-foreground' : ''
                      }`}
                    >
                      {entry ? (
                        <span>
                          {nt} → {entry.production.join(' ')}
                          {isConflict && <span className="text-destructive ml-1">●</span>}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/30">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

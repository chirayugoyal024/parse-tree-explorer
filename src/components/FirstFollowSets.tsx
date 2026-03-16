interface FirstFollowSetsProps {
  firstSets: Map<string, Set<string>> | null;
  followSets: Map<string, Set<string>> | null;
  nonTerminals: string[];
}

export function FirstFollowSets({ firstSets, followSets, nonTerminals }: FirstFollowSetsProps) {
  if (!firstSets || !followSets || nonTerminals.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="font-mono text-sm font-semibold mb-2 tracking-tight">FIRST Sets</h3>
        <div className="border border-border rounded-md overflow-hidden">
          {nonTerminals.map(nt => (
            <div key={nt} className="flex items-center border-b border-border last:border-b-0 text-xs">
              <div className="font-mono font-semibold px-3 py-2 bg-secondary min-w-[60px]">{nt}</div>
              <div className="font-mono px-3 py-2 text-muted-foreground">
                {'{ '}{[...(firstSets.get(nt) || [])].join(', ')}{' }'}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3 className="font-mono text-sm font-semibold mb-2 tracking-tight">FOLLOW Sets</h3>
        <div className="border border-border rounded-md overflow-hidden">
          {nonTerminals.map(nt => (
            <div key={nt} className="flex items-center border-b border-border last:border-b-0 text-xs">
              <div className="font-mono font-semibold px-3 py-2 bg-secondary min-w-[60px]">{nt}</div>
              <div className="font-mono px-3 py-2 text-muted-foreground">
                {'{ '}{[...(followSets.get(nt) || [])].join(', ')}{' }'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

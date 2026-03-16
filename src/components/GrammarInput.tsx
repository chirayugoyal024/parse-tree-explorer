import { EXAMPLE_GRAMMARS } from '@/lib/ll1-parser';

interface GrammarInputProps {
  value: string;
  onChange: (text: string) => void;
}

export function GrammarInput({ value, onChange }: GrammarInputProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-mono text-sm font-semibold tracking-tight">Grammar (BNF)</h2>
        <select
          className="font-mono text-xs bg-secondary text-secondary-foreground rounded-sm px-2 py-1 border border-border outline-none focus:ring-1 focus:ring-ring"
          onChange={(e) => {
            const key = e.target.value as keyof typeof EXAMPLE_GRAMMARS;
            if (EXAMPLE_GRAMMARS[key]) onChange(EXAMPLE_GRAMMARS[key]);
          }}
          defaultValue=""
        >
          <option value="" disabled>Load example...</option>
          {Object.keys(EXAMPLE_GRAMMARS).map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`E -> T E'\nE' -> + T E' | ε\nT -> F T'\nT' -> * F T' | ε\nF -> ( E ) | id`}
        className="w-full h-48 font-mono text-sm bg-card text-card-foreground border border-border rounded-md p-3 resize-none outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50 leading-relaxed"
        spellCheck={false}
      />
      <p className="text-xs text-muted-foreground font-sans">
        Use <code className="font-mono bg-secondary px-1 rounded-sm">→</code> or <code className="font-mono bg-secondary px-1 rounded-sm">-&gt;</code> for productions. Separate alternatives with <code className="font-mono bg-secondary px-1 rounded-sm">|</code>. Use <code className="font-mono bg-secondary px-1 rounded-sm">ε</code> for epsilon.
      </p>
    </div>
  );
}

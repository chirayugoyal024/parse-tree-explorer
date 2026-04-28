import { useState } from 'react';
import { LL1ParserPanel } from '@/components/LL1ParserPanel';
import { LRParserPanel } from '@/components/LRParserPanel';

type Mode = 'LL1' | 'LR0' | 'SLR1';

const MODE_LABELS: Record<Mode, string> = {
  LL1: 'LL(1)',
  LR0: 'LR(0)',
  SLR1: 'SLR(1)',
};

const MODE_SUB: Record<Mode, string> = {
  LL1: 'Top-down predictive parser',
  LR0: 'Bottom-up shift-reduce parser',
  SLR1: 'Bottom-up parser with FOLLOW lookahead',
};

const Index = () => {
  const [mode, setMode] = useState<Mode>('LL1');

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border px-6 py-3 flex items-center justify-between bg-card gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <h1 className="font-mono text-base font-bold tracking-tight">Lexis</h1>
          <span className="text-xs text-muted-foreground font-sans">{MODE_SUB[mode]}</span>
        </div>
        <div className="flex items-center gap-1 bg-muted rounded-md p-0.5">
          {(Object.keys(MODE_LABELS) as Mode[]).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`font-mono text-xs px-3 py-1.5 rounded-sm transition-colors ${
                mode === m ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {MODE_LABELS[m]}
            </button>
          ))}
        </div>
      </header>

      {mode === 'LL1' && <LL1ParserPanel />}
      {mode === 'LR0' && <LRParserPanel mode="LR0" />}
      {mode === 'SLR1' && <LRParserPanel mode="SLR1" />}
    </div>
  );
};

export default Index;

import { motion } from 'framer-motion';
import { formatItem, type ItemSet } from '@/lib/lr-parser';

interface Props {
  states: ItemSet[];
  currentState?: number;
}

export function LRStateList({ states, currentState }: Props) {
  if (!states.length) return null;
  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-mono text-sm font-semibold tracking-tight">Canonical Item Sets ({states.length})</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        {states.map(s => {
          const active = s.id === currentState;
          return (
            <motion.div
              key={s.id}
              animate={{
                borderColor: active ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                boxShadow: active ? '0 0 0 2px hsl(var(--primary) / 0.25)' : '0 0 0 0px transparent',
              }}
              transition={{ duration: 0.2 }}
              className="border rounded-md p-2 bg-card"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-xs font-semibold">I{s.id}</span>
                {active && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 bg-primary text-primary-foreground rounded-sm">
                    current
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-0.5">
                {s.items.map((it, i) => (
                  <div key={i} className="font-mono text-[11px] text-foreground/90 leading-snug">
                    {formatItem(it)}
                  </div>
                ))}
              </div>
              {s.transitions.size > 0 && (
                <div className="mt-1.5 pt-1.5 border-t border-border flex flex-wrap gap-x-2 gap-y-0.5">
                  {[...s.transitions.entries()].map(([sym, tgt]) => (
                    <span key={sym} className="font-mono text-[10px] text-muted-foreground">
                      <span className="text-foreground">{sym}</span>→I{tgt}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

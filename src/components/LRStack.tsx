import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  stateStack: number[];
  symbolStack: string[];
}

export function LRStack({ stateStack, symbolStack }: Props) {
  // Render interleaved: state0 sym1 state1 sym2 state2 ...
  const items: { kind: 'state' | 'sym'; value: string }[] = [];
  items.push({ kind: 'state', value: String(stateStack[0]) });
  for (let i = 0; i < symbolStack.length; i++) {
    items.push({ kind: 'sym', value: symbolStack[i] });
    items.push({ kind: 'state', value: String(stateStack[i + 1]) });
  }
  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-mono text-xs font-semibold tracking-tight text-muted-foreground uppercase">Stack</h3>
      <div className="flex flex-col-reverse gap-1 border-l-2 border-primary pl-3 min-h-[60px]">
        <AnimatePresence mode="popLayout">
          {items.map((it, i) => (
            <motion.div
              key={`${it.kind}-${it.value}-${i}-${items.length}`}
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 10, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
              className={`font-mono text-sm py-1 px-2 rounded-sm border border-border ${
                i === items.length - 1
                  ? 'bg-terminal text-terminal-foreground font-semibold active-step-shadow'
                  : it.kind === 'state'
                    ? 'bg-secondary text-secondary-foreground'
                    : 'bg-card'
              }`}
            >
              {it.kind === 'state' ? `q${it.value}` : it.value}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

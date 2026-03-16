import { motion, AnimatePresence } from 'framer-motion';

interface ParsingStackProps {
  stack: string[];
}

export function ParsingStack({ stack }: ParsingStackProps) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-mono text-xs font-semibold tracking-tight text-muted-foreground uppercase">Stack</h3>
      <div className="flex flex-col-reverse gap-1 border-l-2 border-primary pl-3 min-h-[60px]">
        <AnimatePresence mode="popLayout">
          {stack.map((symbol, i) => (
            <motion.div
              key={`${symbol}-${i}-${stack.length}`}
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 10, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
              className={`font-mono text-sm py-1 px-2 rounded-sm border border-border ${
                i === stack.length - 1 ? 'bg-terminal text-terminal-foreground font-semibold active-step-shadow' : 'bg-card'
              }`}
            >
              {symbol}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

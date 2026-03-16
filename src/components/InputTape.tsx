import { motion } from 'framer-motion';

interface InputTapeProps {
  tokens: string[];
  currentIndex?: number;
}

export function InputTape({ tokens }: InputTapeProps) {
  // The first token is the current one being looked at
  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-mono text-xs font-semibold tracking-tight text-muted-foreground uppercase">Input</h3>
      <div className="flex gap-0 overflow-x-auto">
        {tokens.map((token, i) => (
          <div key={`${token}-${i}`} className="flex flex-col items-center">
            <motion.div
              className={`font-mono text-sm py-1.5 px-3 border border-border ${
                i === 0
                  ? 'bg-terminal text-terminal-foreground font-semibold border-primary'
                  : 'bg-card text-foreground'
              } ${i === 0 ? 'rounded-l-sm' : ''} ${i === tokens.length - 1 ? 'rounded-r-sm' : ''} border-r-0 last:border-r`}
              layout
            >
              {token}
            </motion.div>
            {i === 0 && (
              <motion.div
                layoutId="pointer"
                className="w-0 h-0 border-l-[5px] border-r-[5px] border-b-[6px] border-l-transparent border-r-transparent border-b-primary mt-1"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

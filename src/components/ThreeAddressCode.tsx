import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type TreeNode } from '@/lib/ll1-parser';
import {
  generateTAC,
  formatInstruction,
  formatQuadruple,
  formatTriple,
  type TACInstruction,
} from '@/lib/three-address-code';

interface ThreeAddressCodeProps {
  tree: TreeNode | null;
}

type ViewMode = 'tac' | 'quadruples' | 'triples';

export function ThreeAddressCode({ tree }: ThreeAddressCodeProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('tac');
  const [highlightedLine, setHighlightedLine] = useState<number | null>(null);

  const tacResult = useMemo(() => generateTAC(tree), [tree]);

  if (!tree || tacResult.instructions.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground font-mono text-sm">
        Parse a string to generate three-address code
      </div>
    );
  }

  const { instructions } = tacResult;

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* View Mode Tabs */}
      <div className="flex items-center gap-1 bg-muted rounded-md p-1 w-fit">
        {(['tac', 'quadruples', 'triples'] as ViewMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`font-mono text-xs px-3 py-1.5 rounded-sm transition-colors ${
              viewMode === mode
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {mode === 'tac' ? 'TAC' : mode === 'quadruples' ? 'Quadruples' : 'Triples'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <AnimatePresence mode="wait">
          {viewMode === 'tac' && (
            <motion.div
              key="tac"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex flex-col gap-0.5"
            >
              {instructions.map((instr, i) => (
                <motion.div
                  key={instr.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onMouseEnter={() => setHighlightedLine(i)}
                  onMouseLeave={() => setHighlightedLine(null)}
                  className={`flex items-center gap-3 px-3 py-1.5 rounded-sm font-mono text-sm transition-colors cursor-default ${
                    highlightedLine === i ? 'bg-terminal' : 'hover:bg-muted'
                  }`}
                >
                  <span className="text-muted-foreground text-xs w-6 text-right tabular-nums">{i + 1}.</span>
                  <span className="text-foreground">{formatInstruction(instr)}</span>
                </motion.div>
              ))}
            </motion.div>
          )}

          {viewMode === 'quadruples' && (
            <motion.div
              key="quadruples"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
            >
              <QuadrupleTable instructions={instructions} highlightedLine={highlightedLine} onHighlight={setHighlightedLine} />
            </motion.div>
          )}

          {viewMode === 'triples' && (
            <motion.div
              key="triples"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
            >
              <TripleTable instructions={instructions} highlightedLine={highlightedLine} onHighlight={setHighlightedLine} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground border-t border-border pt-3">
        <span>{instructions.length} instructions</span>
        <span className="text-border">|</span>
        <span>{tacResult.tempCount} temporaries</span>
      </div>
    </div>
  );
}

function QuadrupleTable({
  instructions,
  highlightedLine,
  onHighlight,
}: {
  instructions: TACInstruction[];
  highlightedLine: number | null;
  onHighlight: (i: number | null) => void;
}) {
  return (
    <table className="w-full font-mono text-sm">
      <thead>
        <tr className="border-b border-border">
          <th className="text-left text-xs text-muted-foreground font-semibold px-3 py-2 w-10">#</th>
          <th className="text-left text-xs text-muted-foreground font-semibold px-3 py-2">Op</th>
          <th className="text-left text-xs text-muted-foreground font-semibold px-3 py-2">Arg1</th>
          <th className="text-left text-xs text-muted-foreground font-semibold px-3 py-2">Arg2</th>
          <th className="text-left text-xs text-muted-foreground font-semibold px-3 py-2">Result</th>
        </tr>
      </thead>
      <tbody>
        {instructions.map((instr, i) => {
          const q = formatQuadruple(instr);
          return (
            <motion.tr
              key={instr.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.04 }}
              onMouseEnter={() => onHighlight(i)}
              onMouseLeave={() => onHighlight(null)}
              className={`border-b border-border/50 transition-colors cursor-default ${
                highlightedLine === i ? 'bg-terminal' : 'hover:bg-muted/50'
              }`}
            >
              <td className="px-3 py-1.5 text-muted-foreground text-xs tabular-nums">{i + 1}</td>
              <td className="px-3 py-1.5 text-primary font-semibold">{q.op}</td>
              <td className="px-3 py-1.5">{q.arg1}</td>
              <td className="px-3 py-1.5">{q.arg2}</td>
              <td className="px-3 py-1.5 text-accent font-semibold">{q.result}</td>
            </motion.tr>
          );
        })}
      </tbody>
    </table>
  );
}

function TripleTable({
  instructions,
  highlightedLine,
  onHighlight,
}: {
  instructions: TACInstruction[];
  highlightedLine: number | null;
  onHighlight: (i: number | null) => void;
}) {
  return (
    <table className="w-full font-mono text-sm">
      <thead>
        <tr className="border-b border-border">
          <th className="text-left text-xs text-muted-foreground font-semibold px-3 py-2 w-10">Index</th>
          <th className="text-left text-xs text-muted-foreground font-semibold px-3 py-2">Op</th>
          <th className="text-left text-xs text-muted-foreground font-semibold px-3 py-2">Arg1</th>
          <th className="text-left text-xs text-muted-foreground font-semibold px-3 py-2">Arg2</th>
        </tr>
      </thead>
      <tbody>
        {instructions.map((instr, i) => {
          const t = formatTriple(instr, i);
          return (
            <motion.tr
              key={instr.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.04 }}
              onMouseEnter={() => onHighlight(i)}
              onMouseLeave={() => onHighlight(null)}
              className={`border-b border-border/50 transition-colors cursor-default ${
                highlightedLine === i ? 'bg-terminal' : 'hover:bg-muted/50'
              }`}
            >
              <td className="px-3 py-1.5 text-muted-foreground text-xs">{t.index}</td>
              <td className="px-3 py-1.5 text-primary font-semibold">{t.op}</td>
              <td className="px-3 py-1.5">{t.arg1}</td>
              <td className="px-3 py-1.5">{t.arg2}</td>
            </motion.tr>
          );
        })}
      </tbody>
    </table>
  );
}

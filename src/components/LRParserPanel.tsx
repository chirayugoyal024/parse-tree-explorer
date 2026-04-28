import { useLRParser } from '@/hooks/useLRParser';
import { GrammarInput } from '@/components/GrammarInput';
import { InputTape } from '@/components/InputTape';
import { LRStack } from '@/components/LRStack';
import { LRTable } from '@/components/LRTable';
import { LRStateList } from '@/components/LRStateList';
import { LRForestView } from '@/components/LRForestView';
import { motion } from 'framer-motion';
import { useState } from 'react';
import type { LRMode } from '@/lib/lr-parser';

interface Props {
  mode: LRMode;
}

export function LRParserPanel({ mode }: Props) {
  const {
    grammarText,
    grammar,
    tables,
    inputString,
    setInputString,
    steps,
    currentStep,
    error,
    analyzeGrammar,
    parseInput,
    stepForward,
    stepBackward,
    resetSteps,
  } = useLRParser(mode);

  const [view, setView] = useState<'tree' | 'states'>('tree');
  const cur = steps[currentStep] || null;
  const currentState = cur ? cur.stateStack[cur.stateStack.length - 1] : undefined;

  return (
    <div className="flex flex-1 overflow-hidden">
      <aside className="w-[340px] border-r border-border bg-card flex flex-col overflow-y-auto p-4 gap-5 flex-shrink-0">
        <GrammarInput value={grammarText} onChange={analyzeGrammar} />
        {error && (
          <div className="font-mono text-xs text-destructive bg-conflict p-3 rounded-md border border-destructive/30">
            {error}
          </div>
        )}
        {tables && tables.hasConflicts && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="border border-destructive/30 bg-conflict rounded-md p-3"
          >
            <p className="font-mono text-xs font-semibold text-destructive mb-1">
              {mode === 'LR0' ? 'LR(0)' : 'SLR(1)'} Conflicts
            </p>
            <div className="flex flex-col gap-0.5 max-h-32 overflow-auto">
              {tables.conflictDetails.map((d, i) => (
                <p key={i} className="font-mono text-[11px] text-conflict-foreground">{d}</p>
              ))}
            </div>
          </motion.div>
        )}
        {grammar && tables && (
          <div className="flex flex-col gap-2">
            <h3 className="font-mono text-sm font-semibold tracking-tight">Parse String</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputString}
                onChange={(e) => setInputString(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && parseInput(inputString)}
                placeholder="e.g. id + id * id"
                className="flex-1 font-mono text-sm bg-card text-card-foreground border border-border rounded-sm px-3 py-1.5 outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50"
              />
              <button
                onClick={() => parseInput(inputString)}
                className="font-mono text-xs px-3 py-1.5 bg-primary text-primary-foreground rounded-sm hover:opacity-90 transition-opacity"
              >
                Parse
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground font-sans">
              {tables.states.length} states • {tables.flatProductions.length} productions
            </p>
          </div>
        )}
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        {tables && (
          <div className="p-4 border-b border-border overflow-auto max-h-[40vh]">
            <LRTable tables={tables} mode={mode} />
          </div>
        )}

        <div className="flex-1 p-4 overflow-auto flex flex-col">
          {steps.length > 0 ? (
            <>
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <button
                  onClick={resetSteps}
                  className="font-mono text-xs px-3 py-1.5 bg-secondary text-secondary-foreground rounded-sm border border-border hover:bg-muted transition-colors"
                >
                  Reset
                </button>
                <button
                  onClick={stepBackward}
                  disabled={currentStep === 0}
                  className="font-mono text-xs px-3 py-1.5 bg-secondary text-secondary-foreground rounded-sm border border-border hover:bg-muted transition-colors disabled:opacity-30"
                >
                  ← Step Back
                </button>
                <button
                  onClick={stepForward}
                  disabled={currentStep >= steps.length - 1}
                  className="font-mono text-xs px-3 py-1.5 bg-primary text-primary-foreground rounded-sm hover:opacity-90 transition-opacity disabled:opacity-30"
                >
                  Step Forward →
                </button>
                <span className="font-mono text-xs text-muted-foreground tabular-nums">
                  Step {currentStep + 1} / {steps.length}
                </span>
                {cur && (
                  <span
                    className={`font-mono text-xs px-2 py-0.5 rounded-sm ${
                      cur.action.startsWith('✓')
                        ? 'bg-success text-success-foreground'
                        : cur.action.startsWith('✗')
                          ? 'bg-conflict text-conflict-foreground'
                          : 'bg-secondary text-secondary-foreground'
                    }`}
                  >
                    {cur.action}
                  </span>
                )}

                <div className="ml-auto flex items-center gap-1 bg-muted rounded-md p-0.5">
                  <button
                    onClick={() => setView('tree')}
                    className={`font-mono text-xs px-3 py-1 rounded-sm transition-colors ${
                      view === 'tree' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Parse Forest
                  </button>
                  <button
                    onClick={() => setView('states')}
                    className={`font-mono text-xs px-3 py-1 rounded-sm transition-colors ${
                      view === 'states' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Item Sets
                  </button>
                </div>
              </div>

              <div className="flex gap-6 flex-1">
                <div className="flex flex-col gap-4 w-56 flex-shrink-0">
                  {cur && (
                    <>
                      <LRStack stateStack={cur.stateStack} symbolStack={cur.symbolStack} />
                      <InputTape tokens={cur.input} />
                    </>
                  )}
                </div>
                <div className="flex-1 border border-border rounded-md bg-card p-4 overflow-auto">
                  {view === 'tree' ? (
                    <LRForestView
                      forest={cur?.treeStack || []}
                      nonTerminals={tables?.nonTerminals || []}
                    />
                  ) : (
                    tables && <LRStateList states={tables.states} currentState={currentState} />
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="font-mono text-lg font-semibold text-foreground mb-2">
                  {mode === 'LR0' ? 'Bottom-up parsing.' : 'SLR(1) — smarter reductions.'}
                </p>
                <p className="text-sm text-muted-foreground font-sans max-w-md">
                  Enter a grammar in the sidebar, then parse a string to step through the
                  {mode === 'LR0' ? ' LR(0) ' : ' SLR(1) '}
                  shift/reduce process and bottom-up parse forest.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

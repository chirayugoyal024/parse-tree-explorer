import { useLL1Parser } from '@/hooks/useLL1Parser';
import { GrammarInput } from '@/components/GrammarInput';
import { FirstFollowSets } from '@/components/FirstFollowSets';
import { LL1Table } from '@/components/LL1Table';
import { ParsingStack } from '@/components/ParsingStack';
import { InputTape } from '@/components/InputTape';
import { ParseTreeView } from '@/components/ParseTreeView';
import { ThreeAddressCode } from '@/components/ThreeAddressCode';
import { motion } from 'framer-motion';
import { useState } from 'react';

export function LL1ParserPanel() {
  const {
    grammarText,
    grammar,
    firstSets,
    followSets,
    parseTable,
    hasConflicts,
    leftRecursion,
    parseSteps,
    currentStep,
    inputString,
    error,
    analyzeGrammar,
    parseInput,
    stepForward,
    stepBackward,
    resetSteps,
    fixLeftRecursion,
    setInputString,
  } = useLL1Parser();

  const currentParseStep = parseSteps[currentStep] || null;
  const [mainView, setMainView] = useState<'tree' | 'tac'>('tree');

  return (
    <div className="flex flex-1 overflow-hidden">
      <aside className="w-[340px] border-r border-border bg-card flex flex-col overflow-y-auto p-4 gap-5 flex-shrink-0">
        <GrammarInput value={grammarText} onChange={analyzeGrammar} />

        {leftRecursion?.hasLeftRecursion && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-destructive/30 bg-conflict rounded-md p-3"
          >
            <p className="font-mono text-xs font-semibold text-destructive mb-1">Left Recursion Detected</p>
            {leftRecursion.recursiveRules.map((r, i) => (
              <p key={i} className="font-mono text-xs text-conflict-foreground">{r}</p>
            ))}
            <button
              onClick={() => {
                const fixed = fixLeftRecursion();
                analyzeGrammar(fixed);
              }}
              className="mt-2 font-mono text-xs px-3 py-1 bg-primary text-primary-foreground rounded-sm hover:opacity-90 transition-opacity"
            >
              Refactor Grammar
            </button>
          </motion.div>
        )}

        {error && (
          <div className="font-mono text-xs text-destructive bg-conflict p-3 rounded-md border border-destructive/30">
            {error}
          </div>
        )}

        <FirstFollowSets
          firstSets={firstSets}
          followSets={followSets}
          nonTerminals={grammar?.nonTerminals || []}
        />

        {grammar && parseTable && !hasConflicts && (
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
          </div>
        )}
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        {parseTable && (
          <div className="p-4 border-b border-border overflow-auto">
            <LL1Table
              table={parseTable}
              terminals={grammar?.terminals || []}
              nonTerminals={grammar?.nonTerminals || []}
              hasConflicts={hasConflicts}
            />
          </div>
        )}

        <div className="flex-1 p-4 overflow-auto flex flex-col">
          {parseSteps.length > 0 ? (
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
                  disabled={currentStep >= parseSteps.length - 1}
                  className="font-mono text-xs px-3 py-1.5 bg-primary text-primary-foreground rounded-sm hover:opacity-90 transition-opacity disabled:opacity-30"
                >
                  Step Forward →
                </button>
                <span className="font-mono text-xs text-muted-foreground tabular-nums">
                  Step {currentStep + 1} / {parseSteps.length}
                </span>
                {currentParseStep && (
                  <span className={`font-mono text-xs px-2 py-0.5 rounded-sm ${
                    currentParseStep.action.startsWith('✓') ? 'bg-success text-success-foreground' :
                    currentParseStep.action.startsWith('✗') ? 'bg-conflict text-conflict-foreground' :
                    'bg-secondary text-secondary-foreground'
                  }`}>
                    {currentParseStep.action}
                  </span>
                )}

                <div className="ml-auto flex items-center gap-1 bg-muted rounded-md p-0.5">
                  <button
                    onClick={() => setMainView('tree')}
                    className={`font-mono text-xs px-3 py-1 rounded-sm transition-colors ${
                      mainView === 'tree' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Parse Tree
                  </button>
                  <button
                    onClick={() => setMainView('tac')}
                    className={`font-mono text-xs px-3 py-1 rounded-sm transition-colors ${
                      mainView === 'tac' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Three Address Code
                  </button>
                </div>
              </div>

              <div className="flex gap-6 flex-1">
                <div className="flex flex-col gap-4 w-48 flex-shrink-0">
                  {currentParseStep && (
                    <>
                      <ParsingStack stack={currentParseStep.stack} />
                      <InputTape tokens={currentParseStep.input} />
                    </>
                  )}
                </div>
                <div className="flex-1 border border-border rounded-md bg-card p-4 overflow-auto">
                  {mainView === 'tree' ? (
                    <ParseTreeView
                      tree={currentParseStep?.treeSnapshot || null}
                      nonTerminals={grammar?.nonTerminals || []}
                    />
                  ) : (
                    <ThreeAddressCode
                      tree={currentParseStep?.treeSnapshot || null}
                    />
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="font-mono text-lg font-semibold text-foreground mb-2">Top-down parsing.</p>
                <p className="text-sm text-muted-foreground font-sans max-w-md">
                  Enter a grammar in the sidebar, then parse a string to visualize the LL(1) parsing process step by step.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

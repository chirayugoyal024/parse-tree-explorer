import { useLL1Parser } from '@/hooks/useLL1Parser';
import { GrammarInput } from '@/components/GrammarInput';
import { FirstFollowSets } from '@/components/FirstFollowSets';
import { LL1Table } from '@/components/LL1Table';
import { ParsingStack } from '@/components/ParsingStack';
import { InputTape } from '@/components/InputTape';
import { ParseTreeView } from '@/components/ParseTreeView';
import { motion } from 'framer-motion';

const Index = () => {
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-6 py-3 flex items-center justify-between bg-card">
        <div className="flex items-center gap-3">
          <h1 className="font-mono text-base font-bold tracking-tight">Lexis</h1>
          <span className="text-xs text-muted-foreground font-sans">LL(1) Visual Parser</span>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
          {grammar && (
            <>
              <span>{grammar.productions.length} productions</span>
              <span className="text-border">|</span>
              <span>{grammar.terminals.length - 1} terminals</span>
              <span className="text-border">|</span>
              <span>{grammar.nonTerminals.length} non-terminals</span>
            </>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-[340px] border-r border-border bg-card flex flex-col overflow-y-auto p-4 gap-5 flex-shrink-0">
          <GrammarInput value={grammarText} onChange={analyzeGrammar} />

          {/* Left Recursion Warning */}
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

          {/* Input String */}
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

        {/* Main Stage */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Parse Table */}
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

          {/* Parse Tree */}
          <div className="flex-1 p-4 overflow-auto flex flex-col">
            {parseSteps.length > 0 ? (
              <>
                {/* Step Controls */}
                <div className="flex items-center gap-3 mb-4">
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
                </div>

                {/* Stack + Input + Tree */}
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
                    <ParseTreeView
                      tree={currentParseStep?.treeSnapshot || null}
                      nonTerminals={grammar?.nonTerminals || []}
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <p className="font-mono text-lg font-semibold text-foreground mb-2">Deconstruct the language.</p>
                  <p className="text-sm text-muted-foreground font-sans max-w-md">
                    Enter a grammar in the sidebar, then parse a string to visualize the LL(1) parsing process step by step.
                  </p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;

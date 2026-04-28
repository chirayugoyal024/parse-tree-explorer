import { useCallback, useState } from 'react';
import { parseGrammar, type Grammar } from '@/lib/ll1-parser';
import {
  buildLRTables,
  generateLRSteps,
  type LRMode,
  type LRStep,
  type LRTables,
} from '@/lib/lr-parser';

export function useLRParser(mode: LRMode) {
  const [grammarText, setGrammarText] = useState('');
  const [grammar, setGrammar] = useState<Grammar | null>(null);
  const [tables, setTables] = useState<LRTables | null>(null);
  const [inputString, setInputString] = useState('');
  const [steps, setSteps] = useState<LRStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const analyzeGrammar = useCallback((text: string) => {
    setGrammarText(text);
    setError(null);
    setSteps([]);
    setCurrentStep(0);
    try {
      const g = parseGrammar(text);
      if (g.productions.length === 0) {
        setGrammar(null);
        setTables(null);
        return;
      }
      setGrammar(g);
      const t = buildLRTables(g, mode);
      setTables(t);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to build tables');
    }
  }, [mode]);

  const parseInput = useCallback((str: string) => {
    setInputString(str);
    if (!tables) return;
    try {
      const s = generateLRSteps(tables, str);
      setSteps(s);
      setCurrentStep(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Parsing failed');
    }
  }, [tables]);

  const stepForward = useCallback(() => {
    setSteps(prev => {
      setCurrentStep(s => Math.min(s + 1, prev.length - 1));
      return prev;
    });
  }, []);
  const stepBackward = useCallback(() => setCurrentStep(s => Math.max(s - 1, 0)), []);
  const resetSteps = useCallback(() => setCurrentStep(0), []);

  return {
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
  };
}

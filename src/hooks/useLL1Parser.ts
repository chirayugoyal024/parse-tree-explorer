import { useState, useCallback } from 'react';
import {
  parseGrammar,
  computeFirst,
  computeFollow,
  buildParseTable,
  generateParseSteps,
  detectLeftRecursion,
  removeLeftRecursion,
  type Grammar,
  type ParseStep,
  type ParseTable,
} from '@/lib/ll1-parser';

export function useLL1Parser() {
  const [grammarText, setGrammarText] = useState('');
  const [grammar, setGrammar] = useState<Grammar | null>(null);
  const [firstSets, setFirstSets] = useState<Map<string, Set<string>> | null>(null);
  const [followSets, setFollowSets] = useState<Map<string, Set<string>> | null>(null);
  const [parseTable, setParseTable] = useState<ParseTable | null>(null);
  const [hasConflicts, setHasConflicts] = useState(false);
  const [leftRecursion, setLeftRecursion] = useState<{ hasLeftRecursion: boolean; recursiveRules: string[] } | null>(null);
  const [parseSteps, setParseSteps] = useState<ParseStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [inputString, setInputString] = useState('');
  const [error, setError] = useState<string | null>(null);

  const analyzeGrammar = useCallback((text: string) => {
    setGrammarText(text);
    setError(null);
    setParseSteps([]);
    setCurrentStep(0);

    try {
      const g = parseGrammar(text);
      if (g.productions.length === 0) {
        setGrammar(null);
        setFirstSets(null);
        setFollowSets(null);
        setParseTable(null);
        setLeftRecursion(null);
        return;
      }
      setGrammar(g);

      const lr = detectLeftRecursion(g);
      setLeftRecursion(lr);

      const f = computeFirst(g);
      setFirstSets(f);

      const fo = computeFollow(g, f);
      setFollowSets(fo);

      const { table, conflicts } = buildParseTable(g, f, fo);
      setParseTable(table);
      setHasConflicts(conflicts);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to parse grammar');
    }
  }, []);

  const parseInput = useCallback((str: string) => {
    setInputString(str);
    if (!grammar || !parseTable) return;
    try {
      const steps = generateParseSteps(grammar, parseTable, str);
      setParseSteps(steps);
      setCurrentStep(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Parsing failed');
    }
  }, [grammar, parseTable]);

  const stepForward = useCallback(() => {
    setCurrentStep(s => Math.min(s + 1, parseSteps.length - 1));
  }, [parseSteps.length]);

  const stepBackward = useCallback(() => {
    setCurrentStep(s => Math.max(s - 1, 0));
  }, []);

  const resetSteps = useCallback(() => {
    setCurrentStep(0);
  }, []);

  const fixLeftRecursion = useCallback(() => {
    const fixed = removeLeftRecursion(grammarText);
    analyzeGrammar(fixed);
    return fixed;
  }, [grammarText, analyzeGrammar]);

  return {
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
  };
}

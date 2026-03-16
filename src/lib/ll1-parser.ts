// LL(1) Parser Engine
// Handles grammar parsing, FIRST/FOLLOW sets, parsing table, and step-through parsing

export interface Production {
  lhs: string;
  rhs: string[][];
}

export interface Grammar {
  productions: Production[];
  nonTerminals: string[];
  terminals: string[];
  startSymbol: string;
}

export interface ParseTableEntry {
  production: string[];
  conflicting?: string[][];
}

export type ParseTable = Map<string, Map<string, ParseTableEntry>>;

export interface ParseStep {
  stack: string[];
  input: string[];
  action: string;
  treeSnapshot: TreeNode | null;
}

export interface TreeNode {
  id: string;
  symbol: string;
  children: TreeNode[];
  matched?: boolean;
}

const EPSILON = 'ε';
const END_MARKER = '$';

// Parse grammar text into structured Grammar
export function parseGrammar(text: string): Grammar {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0 && !l.startsWith('//'));
  const productions: Production[] = [];
  const nonTerminals = new Set<string>();
  const allSymbols = new Set<string>();

  for (const line of lines) {
    const match = line.match(/^(\S+)\s*->\s*(.+)$/);
    if (!match) continue;
    const lhs = match[1];
    const rhsParts = match[2].split('|').map(p => p.trim());
    const rhs: string[][] = [];
    nonTerminals.add(lhs);

    for (const part of rhsParts) {
      const symbols = part.split(/\s+/).filter(s => s.length > 0);
      rhs.push(symbols);
      symbols.forEach(s => allSymbols.add(s));
    }

    productions.push({ lhs, rhs });
  }

  const terminals = [...allSymbols].filter(s => !nonTerminals.has(s) && s !== EPSILON);

  return {
    productions,
    nonTerminals: [...nonTerminals],
    terminals: [...terminals, END_MARKER],
    startSymbol: productions.length > 0 ? productions[0].lhs : '',
  };
}

// Compute FIRST sets
export function computeFirst(grammar: Grammar): Map<string, Set<string>> {
  const first = new Map<string, Set<string>>();

  // Initialize
  for (const t of grammar.terminals) {
    first.set(t, new Set([t]));
  }
  first.set(EPSILON, new Set([EPSILON]));
  for (const nt of grammar.nonTerminals) {
    first.set(nt, new Set());
  }

  let changed = true;
  while (changed) {
    changed = false;
    for (const prod of grammar.productions) {
      for (const rhs of prod.rhs) {
        const result = firstOfSequence(rhs, first);
        const currentFirst = first.get(prod.lhs)!;
        const sizeBefore = currentFirst.size;
        result.forEach(s => currentFirst.add(s));
        if (currentFirst.size > sizeBefore) changed = true;
      }
    }
  }

  return first;
}

function firstOfSequence(symbols: string[], first: Map<string, Set<string>>): Set<string> {
  const result = new Set<string>();
  if (symbols.length === 0 || (symbols.length === 1 && symbols[0] === EPSILON)) {
    result.add(EPSILON);
    return result;
  }

  for (let i = 0; i < symbols.length; i++) {
    const sym = symbols[i];
    const symFirst = first.get(sym);
    if (!symFirst) {
      result.add(sym);
      return result;
    }
    symFirst.forEach(s => { if (s !== EPSILON) result.add(s); });
    if (!symFirst.has(EPSILON)) return result;
    if (i === symbols.length - 1) result.add(EPSILON);
  }

  return result;
}

// Compute FOLLOW sets
export function computeFollow(grammar: Grammar, first: Map<string, Set<string>>): Map<string, Set<string>> {
  const follow = new Map<string, Set<string>>();
  for (const nt of grammar.nonTerminals) {
    follow.set(nt, new Set());
  }
  follow.get(grammar.startSymbol)!.add(END_MARKER);

  let changed = true;
  while (changed) {
    changed = false;
    for (const prod of grammar.productions) {
      for (const rhs of prod.rhs) {
        for (let i = 0; i < rhs.length; i++) {
          const B = rhs[i];
          if (!grammar.nonTerminals.includes(B)) continue;

          const beta = rhs.slice(i + 1);
          const firstBeta = firstOfSequence(beta, first);
          const followB = follow.get(B)!;
          const sizeBefore = followB.size;

          firstBeta.forEach(s => { if (s !== EPSILON) followB.add(s); });

          if (firstBeta.has(EPSILON) || beta.length === 0) {
            const followA = follow.get(prod.lhs);
            if (followA) followA.forEach(s => followB.add(s));
          }

          if (followB.size > sizeBefore) changed = true;
        }
      }
    }
  }

  return follow;
}

// Build LL(1) Parsing Table
export function buildParseTable(
  grammar: Grammar,
  first: Map<string, Set<string>>,
  follow: Map<string, Set<string>>
): { table: ParseTable; conflicts: boolean } {
  const table: ParseTable = new Map();
  let conflicts = false;

  for (const nt of grammar.nonTerminals) {
    table.set(nt, new Map());
  }

  for (const prod of grammar.productions) {
    for (const rhs of prod.rhs) {
      const firstRhs = firstOfSequence(rhs, first);

      for (const terminal of firstRhs) {
        if (terminal !== EPSILON) {
          const row = table.get(prod.lhs)!;
          const existing = row.get(terminal);
          if (existing) {
            if (!existing.conflicting) existing.conflicting = [existing.production];
            existing.conflicting.push(rhs);
            conflicts = true;
          } else {
            row.set(terminal, { production: rhs });
          }
        }
      }

      if (firstRhs.has(EPSILON)) {
        const followA = follow.get(prod.lhs)!;
        for (const terminal of followA) {
          const row = table.get(prod.lhs)!;
          const existing = row.get(terminal);
          if (existing) {
            if (!existing.conflicting) existing.conflicting = [existing.production];
            existing.conflicting.push(rhs);
            conflicts = true;
          } else {
            row.set(terminal, { production: rhs });
          }
        }
      }
    }
  }

  return { table, conflicts };
}

// Detect left recursion
export function detectLeftRecursion(grammar: Grammar): { hasLeftRecursion: boolean; recursiveRules: string[] } {
  const recursiveRules: string[] = [];

  for (const prod of grammar.productions) {
    for (const rhs of prod.rhs) {
      if (rhs.length > 0 && rhs[0] === prod.lhs) {
        recursiveRules.push(`${prod.lhs} → ${rhs.join(' ')}`);
      }
    }
  }

  return { hasLeftRecursion: recursiveRules.length > 0, recursiveRules };
}

// Remove direct left recursion
export function removeLeftRecursion(grammarText: string): string {
  const grammar = parseGrammar(grammarText);
  const newLines: string[] = [];

  for (const prod of grammar.productions) {
    const recursive: string[][] = [];
    const nonRecursive: string[][] = [];

    for (const rhs of prod.rhs) {
      if (rhs.length > 0 && rhs[0] === prod.lhs) {
        recursive.push(rhs.slice(1));
      } else {
        nonRecursive.push(rhs);
      }
    }

    if (recursive.length === 0) {
      newLines.push(`${prod.lhs} -> ${prod.rhs.map(r => r.join(' ')).join(' | ')}`);
    } else {
      const newNt = prod.lhs + "'";
      const newRhs = nonRecursive.map(r => [...r, newNt].join(' ')).join(' | ');
      newLines.push(`${prod.lhs} -> ${newRhs}`);
      const newNtRhs = recursive.map(r => [...r, newNt].join(' ')).join(' | ') + ' | ε';
      newLines.push(`${newNt} -> ${newNtRhs}`);
    }
  }

  return newLines.join('\n');
}

// Step-through parser
let nodeIdCounter = 0;

function createNode(symbol: string): TreeNode {
  return { id: `node-${nodeIdCounter++}`, symbol, children: [] };
}

export function generateParseSteps(
  grammar: Grammar,
  table: ParseTable,
  inputStr: string
): ParseStep[] {
  nodeIdCounter = 0;
  const tokens = inputStr.trim().split(/\s+/).filter(t => t.length > 0);
  tokens.push(END_MARKER);

  const steps: ParseStep[] = [];
  const root = createNode(grammar.startSymbol);
  const stack: { symbol: string; node: TreeNode }[] = [
    { symbol: END_MARKER, node: createNode(END_MARKER) },
    { symbol: grammar.startSymbol, node: root },
  ];

  const input = [...tokens];

  steps.push({
    stack: stack.map(s => s.symbol).reverse(),
    input: [...input],
    action: `Initialize: Push ${END_MARKER} and ${grammar.startSymbol}`,
    treeSnapshot: JSON.parse(JSON.stringify(root)),
  });

  let limit = 200;
  while (stack.length > 0 && limit-- > 0) {
    const top = stack[stack.length - 1];
    const currentInput = input[0];

    if (top.symbol === END_MARKER && currentInput === END_MARKER) {
      steps.push({
        stack: [END_MARKER],
        input: [END_MARKER],
        action: '✓ Input accepted!',
        treeSnapshot: JSON.parse(JSON.stringify(root)),
      });
      break;
    }

    if (!grammar.nonTerminals.includes(top.symbol)) {
      // Terminal
      if (top.symbol === currentInput) {
        stack.pop();
        input.shift();
        top.node.matched = true;
        steps.push({
          stack: stack.map(s => s.symbol).reverse(),
          input: [...input],
          action: `Match '${top.symbol}'`,
          treeSnapshot: JSON.parse(JSON.stringify(root)),
        });
      } else {
        steps.push({
          stack: stack.map(s => s.symbol).reverse(),
          input: [...input],
          action: `✗ Error: Expected '${top.symbol}', got '${currentInput}'`,
          treeSnapshot: JSON.parse(JSON.stringify(root)),
        });
        break;
      }
    } else {
      // Non-terminal
      const row = table.get(top.symbol);
      const entry = row?.get(currentInput);

      if (!entry) {
        steps.push({
          stack: stack.map(s => s.symbol).reverse(),
          input: [...input],
          action: `✗ Error: No rule for [${top.symbol}, ${currentInput}]`,
          treeSnapshot: JSON.parse(JSON.stringify(root)),
        });
        break;
      }

      stack.pop();
      const production = entry.production;
      const childNodes: TreeNode[] = [];

      if (!(production.length === 1 && production[0] === EPSILON)) {
        for (let i = production.length - 1; i >= 0; i--) {
          const childNode = createNode(production[i]);
          childNodes.unshift(childNode);
          stack.push({ symbol: production[i], node: childNode });
        }
      } else {
        childNodes.push(createNode(EPSILON));
      }

      top.node.children = childNodes;

      steps.push({
        stack: stack.map(s => s.symbol).reverse(),
        input: [...input],
        action: `${top.symbol} → ${production.join(' ')}`,
        treeSnapshot: JSON.parse(JSON.stringify(root)),
      });
    }
  }

  return steps;
}

// Example grammars
export const EXAMPLE_GRAMMARS = {
  'Expression (LL1)': `E -> T E'
E' -> + T E' | ε
T -> F T'
T' -> * F T' | ε
F -> ( E ) | id`,
  'Simple Assignment': `S -> id = E
E -> T E'
E' -> + T E' | ε
T -> id | ( E )`,
  'Left Recursive (not LL1)': `E -> E + T | T
T -> T * F | F
F -> ( E ) | id`,
  'If-Else': `S -> if E then S S'
S' -> else S | ε
E -> id`,
};

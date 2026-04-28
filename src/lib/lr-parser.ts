// LR(0) and SLR(1) Parser Engine
// Builds canonical LR(0) item sets, GOTO graph, ACTION/GOTO tables and parsing steps.

import {
  type Grammar,
  type Production,
  computeFollow,
  computeFirst,
} from './ll1-parser';

export const EPSILON = 'ε';
export const END_MARKER = '$';
export const AUG_START = "S'";

export interface LRItem {
  lhs: string;
  rhs: string[];
  dot: number;
  prodIndex: number; // index into flat production list
}

export interface ItemSet {
  id: number;
  items: LRItem[];
  transitions: Map<string, number>; // symbol -> next state id
}

export type LRActionType = 'shift' | 'reduce' | 'accept' | 'error';

export interface LRAction {
  type: LRActionType;
  target?: number; // shift state or reduce production index
  conflicting?: LRAction[];
}

export interface FlatProduction {
  index: number;
  lhs: string;
  rhs: string[];
}

export interface LRTables {
  states: ItemSet[];
  flatProductions: FlatProduction[];
  action: Map<number, Map<string, LRAction>>;
  gotoTable: Map<number, Map<string, number>>;
  hasConflicts: boolean;
  conflictDetails: string[];
  augmentedStart: string;
  terminals: string[];
  nonTerminals: string[];
  startSymbol: string;
}

export interface LRStep {
  stateStack: number[];
  symbolStack: string[];
  input: string[];
  action: string;
  // For visualizing reductions as a tree similar to LL1:
  treeStack: TreeBuildNode[]; // parallel to symbolStack (for symbols only, not states)
  treeRoot: TreeBuildNode | null;
}

export interface TreeBuildNode {
  id: string;
  symbol: string;
  children: TreeBuildNode[];
  matched?: boolean;
}

export type LRMode = 'LR0' | 'SLR1';

// ---------- Augment grammar & flatten ----------

export function augmentGrammar(grammar: Grammar): { aug: Grammar; flat: FlatProduction[] } {
  const augStart = AUG_START;
  // Avoid name clash
  let s = augStart;
  while (grammar.nonTerminals.includes(s)) s += "'";

  const augProd: Production = { lhs: s, rhs: [[grammar.startSymbol]] };
  const productions = [augProd, ...grammar.productions];

  const flat: FlatProduction[] = [];
  let idx = 0;
  for (const p of productions) {
    for (const rhs of p.rhs) {
      flat.push({ index: idx++, lhs: p.lhs, rhs });
    }
  }

  const aug: Grammar = {
    productions,
    nonTerminals: [s, ...grammar.nonTerminals],
    terminals: grammar.terminals.includes(END_MARKER)
      ? grammar.terminals
      : [...grammar.terminals, END_MARKER],
    startSymbol: s,
  };

  return { aug, flat };
}

// ---------- Closure / GOTO ----------

function itemKey(it: LRItem): string {
  return `${it.prodIndex}@${it.dot}`;
}

function setKey(items: LRItem[]): string {
  return items.map(itemKey).sort().join('|');
}

function closure(items: LRItem[], flat: FlatProduction[], grammar: Grammar): LRItem[] {
  const result: LRItem[] = [...items];
  const seen = new Set(result.map(itemKey));
  let changed = true;
  while (changed) {
    changed = false;
    for (const it of [...result]) {
      const sym = it.rhs[it.dot];
      if (!sym) continue;
      if (!grammar.nonTerminals.includes(sym)) continue;
      for (const fp of flat) {
        if (fp.lhs !== sym) continue;
        const newItem: LRItem = { lhs: fp.lhs, rhs: fp.rhs, dot: 0, prodIndex: fp.index };
        const k = itemKey(newItem);
        if (!seen.has(k)) {
          seen.add(k);
          result.push(newItem);
          changed = true;
        }
      }
    }
  }
  return result;
}

function gotoSet(items: LRItem[], symbol: string, flat: FlatProduction[], grammar: Grammar): LRItem[] {
  const moved: LRItem[] = [];
  for (const it of items) {
    if (it.rhs[it.dot] === symbol) {
      moved.push({ ...it, dot: it.dot + 1 });
    }
  }
  if (moved.length === 0) return [];
  return closure(moved, flat, grammar);
}

// ---------- Build canonical collection ----------

export function buildLRTables(originalGrammar: Grammar, mode: LRMode): LRTables {
  const { aug, flat } = augmentGrammar(originalGrammar);
  const startProd = flat[0]; // S' -> S
  const startItem: LRItem = { lhs: startProd.lhs, rhs: startProd.rhs, dot: 0, prodIndex: 0 };
  const initial = closure([startItem], flat, aug);

  const states: ItemSet[] = [{ id: 0, items: initial, transitions: new Map() }];
  const stateIndex = new Map<string, number>();
  stateIndex.set(setKey(initial), 0);

  const grammarSymbols = [...aug.nonTerminals, ...aug.terminals.filter(t => t !== END_MARKER)];

  let i = 0;
  while (i < states.length) {
    const cur = states[i];
    const symbolsAfterDot = new Set<string>();
    cur.items.forEach(it => {
      const s = it.rhs[it.dot];
      if (s && s !== EPSILON) symbolsAfterDot.add(s);
    });

    for (const sym of symbolsAfterDot) {
      const next = gotoSet(cur.items, sym, flat, aug);
      if (next.length === 0) continue;
      const k = setKey(next);
      let nid = stateIndex.get(k);
      if (nid === undefined) {
        nid = states.length;
        stateIndex.set(k, nid);
        states.push({ id: nid, items: next, transitions: new Map() });
      }
      cur.transitions.set(sym, nid);
    }
    i++;
  }

  // Compute FOLLOW (for SLR(1)).
  const first = computeFirst(aug);
  const follow = computeFollow(aug, first);

  // Build ACTION + GOTO tables.
  const action = new Map<number, Map<string, LRAction>>();
  const gotoTable = new Map<number, Map<string, number>>();
  const conflictDetails: string[] = [];
  let hasConflicts = false;

  const setAction = (state: number, sym: string, act: LRAction) => {
    if (!action.has(state)) action.set(state, new Map());
    const row = action.get(state)!;
    const existing = row.get(sym);
    if (existing) {
      if (
        existing.type === act.type &&
        existing.target === act.target
      ) {
        return;
      }
      hasConflicts = true;
      const list = existing.conflicting ? [...existing.conflicting] : [{ type: existing.type, target: existing.target }];
      list.push({ type: act.type, target: act.target });
      row.set(sym, { ...existing, conflicting: list });
      conflictDetails.push(`State ${state}, symbol '${sym}': ${existing.type}/${act.type} conflict`);
    } else {
      row.set(sym, act);
    }
  };

  for (const st of states) {
    for (const it of st.items) {
      const next = it.rhs[it.dot];
      if (next && next !== EPSILON) {
        // Shift if terminal
        if (!aug.nonTerminals.includes(next)) {
          const tgt = st.transitions.get(next);
          if (tgt !== undefined) {
            setAction(st.id, next, { type: 'shift', target: tgt });
          }
        }
      } else {
        // Dot at end OR epsilon production
        if (it.lhs === aug.startSymbol && it.rhs[0] === originalGrammar.startSymbol) {
          // S' -> S .  ⇒ accept on $
          setAction(st.id, END_MARKER, { type: 'accept' });
        } else {
          // Reduce by this production
          if (mode === 'LR0') {
            // Reduce on every terminal (incl $)
            for (const t of aug.terminals) {
              setAction(st.id, t, { type: 'reduce', target: it.prodIndex });
            }
          } else {
            // SLR(1): reduce only on FOLLOW(lhs)
            const fol = follow.get(it.lhs);
            if (fol) {
              for (const t of fol) {
                setAction(st.id, t, { type: 'reduce', target: it.prodIndex });
              }
            }
          }
        }
      }
    }

    // GOTO for non-terminals
    for (const [sym, tgt] of st.transitions) {
      if (aug.nonTerminals.includes(sym)) {
        if (!gotoTable.has(st.id)) gotoTable.set(st.id, new Map());
        gotoTable.get(st.id)!.set(sym, tgt);
      }
    }
  }

  return {
    states,
    flatProductions: flat,
    action,
    gotoTable,
    hasConflicts,
    conflictDetails,
    augmentedStart: aug.startSymbol,
    terminals: aug.terminals,
    nonTerminals: aug.nonTerminals,
    startSymbol: originalGrammar.startSymbol,
  };
}

// ---------- Step-through parsing ----------

let lrNodeCounter = 0;
function newNode(symbol: string, children: TreeBuildNode[] = []): TreeBuildNode {
  return { id: `lrn-${lrNodeCounter++}`, symbol, children };
}

function cloneTree(n: TreeBuildNode | null): TreeBuildNode | null {
  if (!n) return null;
  return { id: n.id, symbol: n.symbol, matched: n.matched, children: n.children.map(c => cloneTree(c)!) };
}

export function generateLRSteps(tables: LRTables, inputStr: string): LRStep[] {
  lrNodeCounter = 0;
  const tokens = inputStr.trim().split(/\s+/).filter(t => t.length > 0);
  tokens.push(END_MARKER);

  const steps: LRStep[] = [];
  const stateStack: number[] = [0];
  const symbolStack: string[] = [];
  const treeStack: TreeBuildNode[] = [];
  const input = [...tokens];
  let treeRoot: TreeBuildNode | null = null;

  steps.push({
    stateStack: [...stateStack],
    symbolStack: [...symbolStack],
    input: [...input],
    action: 'Initialize: push state 0',
    treeStack: treeStack.map(n => cloneTree(n)!),
    treeRoot: cloneTree(treeRoot),
  });

  let limit = 500;
  while (limit-- > 0) {
    const state = stateStack[stateStack.length - 1];
    const lookahead = input[0];
    const row = tables.action.get(state);
    const act = row?.get(lookahead);

    if (!act) {
      steps.push({
        stateStack: [...stateStack],
        symbolStack: [...symbolStack],
        input: [...input],
        action: `✗ Error: no action for state ${state}, symbol '${lookahead}'`,
        treeStack: treeStack.map(n => cloneTree(n)!),
        treeRoot: cloneTree(treeRoot),
      });
      break;
    }

    if (act.conflicting) {
      // Pick first action to continue but flag in description
      const chosen = act;
      steps.push({
        stateStack: [...stateStack],
        symbolStack: [...symbolStack],
        input: [...input],
        action: `⚠ Conflict at state ${state}/'${lookahead}'. Using ${chosen.type}.`,
        treeStack: treeStack.map(n => cloneTree(n)!),
        treeRoot: cloneTree(treeRoot),
      });
    }

    if (act.type === 'accept') {
      steps.push({
        stateStack: [...stateStack],
        symbolStack: [...symbolStack],
        input: [...input],
        action: '✓ Input accepted!',
        treeStack: treeStack.map(n => cloneTree(n)!),
        treeRoot: cloneTree(treeRoot),
      });
      break;
    }

    if (act.type === 'shift') {
      const tgt = act.target!;
      stateStack.push(tgt);
      symbolStack.push(lookahead);
      const node = newNode(lookahead);
      node.matched = true;
      treeStack.push(node);
      input.shift();
      steps.push({
        stateStack: [...stateStack],
        symbolStack: [...symbolStack],
        input: [...input],
        action: `Shift '${lookahead}', go to state ${tgt}`,
        treeStack: treeStack.map(n => cloneTree(n)!),
        treeRoot: cloneTree(treeRoot),
      });
      continue;
    }

    if (act.type === 'reduce') {
      const prod = tables.flatProductions[act.target!];
      const isEpsilon = prod.rhs.length === 0 || (prod.rhs.length === 1 && prod.rhs[0] === EPSILON);
      const popCount = isEpsilon ? 0 : prod.rhs.length;

      const children: TreeBuildNode[] = [];
      for (let k = 0; k < popCount; k++) {
        stateStack.pop();
        symbolStack.pop();
        children.unshift(treeStack.pop()!);
      }
      if (isEpsilon) {
        children.push(newNode(EPSILON));
      }
      const newParent = newNode(prod.lhs, children);

      const topState = stateStack[stateStack.length - 1];
      const gotoState = tables.gotoTable.get(topState)?.get(prod.lhs);
      if (gotoState === undefined) {
        steps.push({
          stateStack: [...stateStack],
          symbolStack: [...symbolStack],
          input: [...input],
          action: `✗ Error: no GOTO for state ${topState}, '${prod.lhs}'`,
          treeStack: treeStack.map(n => cloneTree(n)!),
          treeRoot: cloneTree(treeRoot),
        });
        break;
      }
      stateStack.push(gotoState);
      symbolStack.push(prod.lhs);
      treeStack.push(newParent);
      treeRoot = newParent;

      const rhsStr = isEpsilon ? EPSILON : prod.rhs.join(' ');
      steps.push({
        stateStack: [...stateStack],
        symbolStack: [...symbolStack],
        input: [...input],
        action: `Reduce by ${prod.lhs} → ${rhsStr}, GOTO state ${gotoState}`,
        treeStack: treeStack.map(n => cloneTree(n)!),
        treeRoot: cloneTree(treeRoot),
      });
      continue;
    }
  }

  return steps;
}

// ---------- Helpers for UI ----------

export function formatItem(it: LRItem): string {
  const parts = [...it.rhs];
  parts.splice(it.dot, 0, '•');
  const rhs = parts.length === 0 ? '•' : parts.join(' ');
  return `${it.lhs} → ${rhs}`;
}

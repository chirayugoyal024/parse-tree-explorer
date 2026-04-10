// Three Address Code Generator
// Generates intermediate code (TAC) from parse trees

import { type TreeNode } from './ll1-parser';

export interface TACInstruction {
  id: number;
  op: string;
  arg1: string;
  arg2: string;
  result: string;
  label?: string;
}

export interface TACResult {
  instructions: TACInstruction[];
  tempCount: number;
  symbolTable: Map<string, string>;
}

let tempCounter = 0;
let instrCounter = 0;

function newTemp(): string {
  return `t${++tempCounter}`;
}

function newInstr(op: string, arg1: string, arg2: string, result: string, label?: string): TACInstruction {
  return { id: ++instrCounter, op, arg1, arg2, result, label };
}

// Extract terminals from a tree node (leaves)
function getLeafValue(node: TreeNode): string | null {
  if (node.children.length === 0 && node.symbol !== 'ε') {
    return node.symbol;
  }
  return null;
}

// Generic TAC generation from parse tree
// Handles expression grammars (E, T, F patterns) and assignment
function generateFromNode(node: TreeNode, instructions: TACInstruction[]): string {
  const sym = node.symbol;

  // Leaf node (terminal)
  if (node.children.length === 0) {
    return node.symbol === 'ε' ? '' : node.symbol;
  }

  // Assignment: S -> id = E
  if (sym === 'S' && node.children.length >= 3 && node.children[1]?.symbol === '=') {
    const lhs = getLeafValue(node.children[0]) || 'x';
    const rhsVal = generateFromNode(node.children[2], instructions);
    instructions.push(newInstr('=', rhsVal, '', lhs));
    return lhs;
  }

  // If-then-else: S -> if E then S S'
  if (sym === 'S' && node.children.length >= 4 && node.children[0]?.symbol === 'if') {
    const condVal = generateFromNode(node.children[1], instructions);
    const labelTrue = `L${instrCounter + 2}`;
    const labelEnd = `Lend`;
    instructions.push(newInstr('iffalse', condVal, '', labelEnd, undefined));
    generateFromNode(node.children[3], instructions); // then body
    if (node.children[4] && node.children[4].children.length > 0 && node.children[4].children[0]?.symbol !== 'ε') {
      instructions.push(newInstr('goto', '', '', labelEnd));
      // else body
      if (node.children[4].children.length > 1) {
        generateFromNode(node.children[4].children[1], instructions);
      }
    }
    return '';
  }

  // E -> T E'  pattern
  if ((sym === 'E' || sym === 'E\'') && node.children.length === 2) {
    const leftVal = generateFromNode(node.children[0], instructions);
    return generateEPrime(node.children[1], leftVal, instructions);
  }

  // T -> F T' pattern
  if ((sym === 'T' || sym === 'T\'') && node.children.length === 2) {
    const leftVal = generateFromNode(node.children[0], instructions);
    return generateTPrime(node.children[1], leftVal, instructions);
  }

  // F -> ( E ) pattern
  if (sym === 'F' && node.children.length === 3 && node.children[0]?.symbol === '(') {
    return generateFromNode(node.children[1], instructions);
  }

  // F -> id or any single-child non-terminal
  if (node.children.length === 1) {
    return generateFromNode(node.children[0], instructions);
  }

  // Generic: binary operation  A -> B op C
  if (node.children.length === 3) {
    const left = generateFromNode(node.children[0], instructions);
    const op = node.children[1].symbol;
    const right = generateFromNode(node.children[2], instructions);
    if (['+', '-', '*', '/', '%', '==', '!=', '<', '>', '<=', '>=', '&&', '||'].includes(op)) {
      const temp = newTemp();
      instructions.push(newInstr(op, left, right, temp));
      return temp;
    }
  }

  // Fallback: process all children, return last non-empty
  let lastVal = '';
  for (const child of node.children) {
    const v = generateFromNode(child, instructions);
    if (v) lastVal = v;
  }
  return lastVal;
}

function generateEPrime(node: TreeNode, inherited: string, instructions: TACInstruction[]): string {
  // E' -> + T E' | ε
  if (node.children.length === 0 || (node.children.length === 1 && node.children[0].symbol === 'ε')) {
    return inherited;
  }

  if (node.children.length >= 3) {
    const op = node.children[0].symbol; // + or -
    const rightVal = generateFromNode(node.children[1], instructions);
    const temp = newTemp();
    instructions.push(newInstr(op, inherited, rightVal, temp));
    return generateEPrime(node.children[2], temp, instructions);
  }

  return inherited;
}

function generateTPrime(node: TreeNode, inherited: string, instructions: TACInstruction[]): string {
  // T' -> * F T' | ε
  if (node.children.length === 0 || (node.children.length === 1 && node.children[0].symbol === 'ε')) {
    return inherited;
  }

  if (node.children.length >= 3) {
    const op = node.children[0].symbol; // * or /
    const rightVal = generateFromNode(node.children[1], instructions);
    const temp = newTemp();
    instructions.push(newInstr(op, inherited, rightVal, temp));
    return generateTPrime(node.children[2], temp, instructions);
  }

  return inherited;
}

export function generateTAC(tree: TreeNode | null): TACResult {
  if (!tree) {
    return { instructions: [], tempCount: 0, symbolTable: new Map() };
  }

  tempCounter = 0;
  instrCounter = 0;
  const instructions: TACInstruction[] = [];
  const symbolTable = new Map<string, string>();

  generateFromNode(tree, instructions);

  return { instructions, tempCount: tempCounter, symbolTable };
}

// Format a TAC instruction as a readable string
export function formatInstruction(instr: TACInstruction): string {
  if (instr.op === '=' && !instr.arg2) {
    return `${instr.result} = ${instr.arg1}`;
  }
  if (instr.op === 'iffalse') {
    return `if false ${instr.arg1} goto ${instr.result}`;
  }
  if (instr.op === 'goto') {
    return `goto ${instr.result}`;
  }
  if (instr.arg2) {
    return `${instr.result} = ${instr.arg1} ${instr.op} ${instr.arg2}`;
  }
  return `${instr.result} = ${instr.op} ${instr.arg1}`;
}

// Format as quadruple: (op, arg1, arg2, result)
export function formatQuadruple(instr: TACInstruction): { op: string; arg1: string; arg2: string; result: string } {
  return {
    op: instr.op,
    arg1: instr.arg1 || '—',
    arg2: instr.arg2 || '—',
    result: instr.result,
  };
}

// Format as triple: (op, arg1, arg2) with index reference
export function formatTriple(instr: TACInstruction, index: number): { index: string; op: string; arg1: string; arg2: string } {
  return {
    index: `(${index})`,
    op: instr.op,
    arg1: instr.arg1 || '—',
    arg2: instr.arg2 || '—',
  };
}

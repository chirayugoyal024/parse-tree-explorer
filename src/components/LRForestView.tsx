import { motion } from 'framer-motion';
import { useMemo } from 'react';
import type { TreeBuildNode } from '@/lib/lr-parser';

interface Props {
  forest: TreeBuildNode[]; // current symbol stack as parse forest (left→right)
  nonTerminals: string[];
}

interface LayoutNode {
  node: TreeBuildNode;
  x: number;
  y: number;
  children: LayoutNode[];
}

const NODE_W = 56;
const NODE_H = 30;
const H_GAP = 12;
const V_GAP = 50;

function layoutTree(node: TreeBuildNode, depth = 0): { layout: LayoutNode; width: number } {
  if (node.children.length === 0) {
    return { layout: { node, x: 0, y: depth * V_GAP, children: [] }, width: NODE_W };
  }
  const cls = node.children.map(c => layoutTree(c, depth + 1));
  const totalW = cls.reduce((s, c) => s + c.width, 0) + (cls.length - 1) * H_GAP;
  let off = -totalW / 2;
  const lc: LayoutNode[] = cls.map(cl => {
    const cx = off + cl.width / 2;
    off += cl.width + H_GAP;
    return { ...cl.layout, x: cx, y: (depth + 1) * V_GAP };
  });
  return { layout: { node, x: 0, y: depth * V_GAP, children: lc }, width: Math.max(totalW, NODE_W) };
}

function bounds(layout: LayoutNode): { minX: number; maxX: number; maxY: number } {
  let minX = layout.x, maxX = layout.x, maxY = layout.y;
  for (const c of layout.children) {
    const b = bounds(c);
    minX = Math.min(minX, b.minX);
    maxX = Math.max(maxX, b.maxX);
    maxY = Math.max(maxY, b.maxY);
  }
  return { minX, maxX, maxY };
}

export function LRForestView({ forest, nonTerminals }: Props) {
  const trees = useMemo(() => forest.map(t => layoutTree(t)), [forest]);

  if (forest.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground font-mono text-sm">
        Parse a string to build the bottom-up forest
      </div>
    );
  }

  const TREE_GAP = 32;
  // Compute total width and per-tree origin offsets
  const sizes = trees.map(t => {
    const b = bounds(t.layout);
    return { w: (b.maxX - b.minX) + NODE_W + 8, h: b.maxY + NODE_H + 8, b };
  });
  const totalW = sizes.reduce((s, x) => s + x.w, 0) + (sizes.length - 1) * TREE_GAP + 40;
  const totalH = Math.max(...sizes.map(s => s.h)) + 40;

  let cursor = 20;
  return (
    <div className="overflow-auto flex-1">
      <svg width={Math.max(totalW, 300)} height={Math.max(totalH, 100)} className="mx-auto">
        {trees.map((t, idx) => {
          const sz = sizes[idx];
          const offsetX = cursor + (-sz.b.minX) + NODE_W / 2;
          const offsetY = 20;
          cursor += sz.w + TREE_GAP;

          const renderEdges = (n: LayoutNode): JSX.Element[] => {
            const out: JSX.Element[] = [];
            for (const ch of n.children) {
              const x1 = n.x + offsetX, y1 = n.y + offsetY + NODE_H;
              const x2 = ch.x + offsetX, y2 = ch.y + offsetY;
              const my = (y1 + y2) / 2;
              out.push(
                <motion.path
                  key={`e-${n.node.id}-${ch.node.id}`}
                  d={`M ${x1} ${y1} L ${x1} ${my} L ${x2} ${my} L ${x2} ${y2}`}
                  fill="none"
                  stroke="hsl(var(--border))"
                  strokeWidth={1.5}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
              );
              out.push(...renderEdges(ch));
            }
            return out;
          };

          const renderNodes = (n: LayoutNode): JSX.Element[] => {
            const isNT = nonTerminals.includes(n.node.symbol);
            const isEps = n.node.symbol === 'ε';
            const matched = n.node.matched;
            const out: JSX.Element[] = [
              <motion.g
                key={`n-${n.node.id}`}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <rect
                  x={n.x + offsetX - NODE_W / 2}
                  y={n.y + offsetY}
                  width={NODE_W}
                  height={NODE_H}
                  rx={4}
                  fill={matched ? 'hsl(var(--success))' : isNT ? 'hsl(var(--card))' : isEps ? 'hsl(var(--muted))' : 'hsl(var(--terminal))'}
                  stroke={matched ? 'hsl(var(--accent))' : isNT ? 'hsl(var(--border))' : isEps ? 'hsl(var(--border))' : 'hsl(var(--primary))'}
                  strokeWidth={1}
                />
                <text
                  x={n.x + offsetX}
                  y={n.y + offsetY + NODE_H / 2 + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={12}
                  fontWeight={isNT ? 600 : 400}
                  className="font-mono"
                  fill={matched ? 'hsl(var(--success-foreground))' : isNT ? 'hsl(var(--foreground))' : isEps ? 'hsl(var(--muted-foreground))' : 'hsl(var(--terminal-foreground))'}
                >
                  {n.node.symbol}
                </text>
              </motion.g>,
            ];
            for (const c of n.children) out.push(...renderNodes(c));
            return out;
          };

          return (
            <g key={idx}>
              {renderEdges(t.layout)}
              {renderNodes(t.layout)}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

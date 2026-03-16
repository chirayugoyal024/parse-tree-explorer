import { type TreeNode } from '@/lib/ll1-parser';
import { motion } from 'framer-motion';
import { useMemo } from 'react';

interface ParseTreeViewProps {
  tree: TreeNode | null;
  nonTerminals: string[];
}

interface LayoutNode {
  node: TreeNode;
  x: number;
  y: number;
  children: LayoutNode[];
}

const NODE_W = 56;
const NODE_H = 30;
const H_GAP = 12;
const V_GAP = 50;

function layoutTree(node: TreeNode, nonTerminals: string[], depth: number = 0): { layout: LayoutNode; width: number } {
  if (node.children.length === 0) {
    return { layout: { node, x: 0, y: depth * V_GAP, children: [] }, width: NODE_W };
  }

  const childLayouts: { layout: LayoutNode; width: number }[] = node.children.map(c =>
    layoutTree(c, nonTerminals, depth + 1)
  );

  const totalWidth = childLayouts.reduce((s, c) => s + c.width, 0) + (childLayouts.length - 1) * H_GAP;
  let offsetX = -totalWidth / 2;

  const layoutChildren: LayoutNode[] = childLayouts.map(cl => {
    const childX = offsetX + cl.width / 2;
    offsetX += cl.width + H_GAP;
    return { ...cl.layout, x: childX, y: (depth + 1) * V_GAP };
  });

  return {
    layout: { node, x: 0, y: depth * V_GAP, children: layoutChildren },
    width: Math.max(totalWidth, NODE_W),
  };
}

function getTreeBounds(layout: LayoutNode): { minX: number; maxX: number; maxY: number } {
  let minX = layout.x;
  let maxX = layout.x;
  let maxY = layout.y;

  for (const child of layout.children) {
    const b = getTreeBounds(child);
    minX = Math.min(minX, b.minX);
    maxX = Math.max(maxX, b.maxX);
    maxY = Math.max(maxY, b.maxY);
  }
  return { minX, maxX, maxY };
}

export function ParseTreeView({ tree, nonTerminals }: ParseTreeViewProps) {
  const layoutResult = useMemo(() => tree ? layoutTree(tree, nonTerminals) : null, [tree, nonTerminals]);
  const layout = layoutResult?.layout ?? null;
  const bounds = useMemo(() => layout ? getTreeBounds(layout) : null, [layout]);

  if (!tree || !layout || !bounds) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground font-mono text-sm">
        Parse a string to see the tree
      </div>
    );
  }

  const svgW = (bounds.maxX - bounds.minX) + NODE_W + 40;
  const svgH = bounds.maxY + NODE_H + 40;
  const offsetX = -bounds.minX + NODE_W / 2 + 20;
  const offsetY = 20;

  function renderEdges(n: LayoutNode): JSX.Element[] {
    const edges: JSX.Element[] = [];
    for (const child of n.children) {
      const x1 = n.x + offsetX;
      const y1 = n.y + offsetY + NODE_H;
      const x2 = child.x + offsetX;
      const y2 = child.y + offsetY;
      const midY = (y1 + y2) / 2;
      edges.push(
        <motion.path
          key={`${n.node.id}-${child.node.id}`}
          d={`M ${x1} ${y1} L ${x1} ${midY} L ${x2} ${midY} L ${x2} ${y2}`}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth={1.5}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
        />
      );
      edges.push(...renderEdges(child));
    }
    return edges;
  }

  function renderNodes(n: LayoutNode): JSX.Element[] {
    const isNT = nonTerminals.includes(n.node.symbol);
    const isEpsilon = n.node.symbol === 'ε';
    const isMatched = n.node.matched;

    const nodes: JSX.Element[] = [
      <motion.g
        key={n.node.id}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
      >
        <rect
          x={n.x + offsetX - NODE_W / 2}
          y={n.y + offsetY}
          width={NODE_W}
          height={NODE_H}
          rx={4}
          fill={isMatched ? 'hsl(var(--success))' : isNT ? 'hsl(var(--card))' : isEpsilon ? 'hsl(var(--muted))' : 'hsl(var(--terminal))'}
          stroke={isMatched ? 'hsl(var(--accent))' : isNT ? 'hsl(var(--border))' : isEpsilon ? 'hsl(var(--border))' : 'hsl(var(--primary))'}
          strokeWidth={1}
        />
        <text
          x={n.x + offsetX}
          y={n.y + offsetY + NODE_H / 2 + 1}
          textAnchor="middle"
          dominantBaseline="middle"
          className="font-mono"
          fontSize={12}
          fontWeight={isNT ? 600 : 400}
          fill={isMatched ? 'hsl(var(--success-foreground))' : isNT ? 'hsl(var(--foreground))' : isEpsilon ? 'hsl(var(--muted-foreground))' : 'hsl(var(--terminal-foreground))'}
        >
          {n.node.symbol}
        </text>
      </motion.g>,
    ];

    for (const child of n.children) {
      nodes.push(...renderNodes(child));
    }
    return nodes;
  }

  return (
    <div className="overflow-auto flex-1">
      <svg width={Math.max(svgW, 300)} height={Math.max(svgH, 100)} className="mx-auto">
        {renderEdges(layout)}
        {renderNodes(layout)}
      </svg>
    </div>
  );
}

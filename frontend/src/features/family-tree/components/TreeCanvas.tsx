import { useCallback, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeTypes,
  Handle,
  Position,
  MarkerType,
} from '@xyflow/react';
import calcTree from 'relatives-tree';
import '@xyflow/react/dist/style.css';
import type { FamilyMember, FamilyRelationship } from '@/types/api';
import { buildTreeData, pickRootId } from '../lib/buildTreeData';

interface MemberNodeData {
  label: string;
  birth_date: string | null;
  death_date: string | null;
  onClick: () => void;
}

function MemberNode({ data }: { data: MemberNodeData }) {
  return (
    <div
      onClick={data.onClick}
      className="rounded-lg px-4 py-3 cursor-pointer min-w-[150px] text-center shadow-md transition-colors"
      style={{ background: '#ffffff', border: '1px solid #9ca3af' }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = '#6366f1')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = '#9ca3af')}
    >
      <Handle type="target" position={Position.Top} style={{ background: '#9ca3af' }} />
      <Handle type="source" position={Position.Bottom} style={{ background: '#9ca3af' }} />
      <Handle type="source" position={Position.Right} id="right" style={{ background: '#9ca3af' }} />
      <Handle type="target" position={Position.Left} id="left" style={{ background: '#9ca3af' }} />
      <p className="text-sm font-semibold" style={{ color: '#111827' }}>{data.label}</p>
      {data.birth_date && (
        <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>
          b. {data.birth_date.slice(0, 4)}
          {data.death_date ? ` – d. ${data.death_date.slice(0, 4)}` : ''}
        </p>
      )}
    </div>
  );
}

const nodeTypes: NodeTypes = { member: MemberNode };

const EDGE_CONFIG: Record<string, { color: string; label: string; dashed?: boolean }> = {
  parent_child: { color: '#4f46e5', label: 'parent → child' },
  spouse:       { color: '#db2777', label: 'spouse', dashed: true },
  sibling:      { color: '#059669', label: 'sibling', dashed: true },
};

const SCALE_X = 220;
const SCALE_Y = 150;

function computePositions(
  members: FamilyMember[],
  relationships: FamilyRelationship[],
): Map<string, { x: number; y: number }> {
  if (members.length === 0) return new Map();
  const nodes = buildTreeData(members, relationships);
  const rootId = pickRootId(nodes, members);
  try {
    const result = calcTree(nodes, { rootId, placeholders: false });
    const positions = new Map<string, { x: number; y: number }>();
    for (const n of result.nodes) {
      positions.set(n.id, { x: n.left * SCALE_X, y: n.top * SCALE_Y });
    }
    return positions;
  } catch {
    // Fallback: place nodes in a simple grid if calcTree fails (e.g. disconnected graph)
    const positions = new Map<string, { x: number; y: number }>();
    members.forEach((m, i) => {
      positions.set(String(m.id), { x: (i % 5) * SCALE_X, y: Math.floor(i / 5) * SCALE_Y });
    });
    return positions;
  }
}

function buildNodes(
  members: FamilyMember[],
  relationships: FamilyRelationship[],
  onSelectMember: (m: FamilyMember) => void,
): Node[] {
  const positions = computePositions(members, relationships);
  return members.map((m) => {
    const auto = positions.get(String(m.id));
    const useOverride = m.position_x !== 0 || m.position_y !== 0;
    const pos = useOverride ? { x: m.position_x, y: m.position_y } : auto ?? { x: 0, y: 0 };
    return {
      id: String(m.id),
      type: 'member',
      position: pos,
      data: {
        label: [m.first_name, m.last_name].filter(Boolean).join(' '),
        birth_date: m.birth_date,
        death_date: m.death_date,
        onClick: () => onSelectMember(m),
      },
    };
  });
}

function buildEdges(relationships: FamilyRelationship[]): Edge[] {
  return relationships.map((r) => {
    const cfg = EDGE_CONFIG[r.relationship_type] ?? { color: '#888', label: r.relationship_type };
    const isSpouseOrSibling = r.relationship_type === 'spouse' || r.relationship_type === 'sibling';
    return {
      id: String(r.id),
      source: String(r.person_a_id),
      target: String(r.person_b_id),
      sourceHandle: isSpouseOrSibling ? 'right' : undefined,
      targetHandle: isSpouseOrSibling ? 'left' : undefined,
      label: cfg.label,
      type: 'smoothstep',
      animated: r.relationship_type === 'spouse',
      style: {
        stroke: cfg.color,
        strokeDasharray: cfg.dashed ? '5 4' : undefined,
        strokeWidth: 2,
      },
      labelStyle: { fontSize: 10, fill: cfg.color, fontWeight: 500 },
      labelBgStyle: { fill: 'transparent' },
      markerEnd: r.relationship_type === 'parent_child'
        ? { type: MarkerType.ArrowClosed, color: cfg.color }
        : undefined,
    };
  });
}

interface TreeCanvasProps {
  members: FamilyMember[];
  relationships: FamilyRelationship[];
  onSelectMember: (m: FamilyMember) => void;
}

export function TreeCanvas({ members, relationships, onSelectMember }: TreeCanvasProps) {
  const initialNodes = useMemo(
    () => buildNodes(members, relationships, onSelectMember),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  const initialEdges = useMemo(() => buildEdges(relationships), []); // eslint-disable-line react-hooks/exhaustive-deps

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Keep nodes and edges in sync when data changes after initial load
  useEffect(() => {
    setNodes(buildNodes(members, relationships, onSelectMember));
  }, [members, relationships, onSelectMember, setNodes]);

  useEffect(() => {
    setEdges(buildEdges(relationships));
  }, [relationships, setEdges]);

  const onNodeClick = useCallback(() => {}, []);

  return (
    <div className="w-full rounded-lg border border-border overflow-hidden">
      <div className="h-[620px]" style={{ background: '#d1d5db' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.25 }}
          minZoom={0.2}
          maxZoom={2}
          style={{ background: '#d1d5db' }}
        >
          <Background color="#9ca3af" gap={24} />
          <Controls style={{ background: '#f3f4f6', border: '1px solid #d1d5db' }} />
          <MiniMap nodeColor={() => '#6366f1'} style={{ background: '#e5e7eb' }} />
        </ReactFlow>
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-4 px-4 py-2 border-t border-border bg-muted/30 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-6 h-0.5 bg-[#4f46e5]" />
          Parent → Child
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-6 h-0.5 border-dashed border-t-2 border-[#db2777]" />
          Spouse
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-6 h-0.5 border-dashed border-t-2 border-[#059669]" />
          Sibling
        </span>
      </div>
    </div>
  );
}

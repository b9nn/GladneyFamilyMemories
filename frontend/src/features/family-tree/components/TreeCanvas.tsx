import { useCallback, useMemo } from 'react';
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
} from '@xyflow/react';
import dagre from 'dagre';
import '@xyflow/react/dist/style.css';
import type { FamilyMember, FamilyRelationship } from '@/types/api';

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
      className="bg-card border border-border rounded-lg px-4 py-3 cursor-pointer hover:border-primary transition-colors min-w-[140px] text-center shadow-sm"
    >
      <Handle type="target" position={Position.Top} className="!bg-border" />
      <p className="text-sm font-semibold text-foreground">{data.label}</p>
      {data.birth_date && (
        <p className="text-xs text-muted-foreground mt-0.5">
          b. {data.birth_date.slice(0, 4)}
          {data.death_date ? ` – d. ${data.death_date.slice(0, 4)}` : ''}
        </p>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-border" />
    </div>
  );
}

const nodeTypes: NodeTypes = { member: MemberNode };

const EDGE_COLORS: Record<string, string> = {
  parent_child: '#6366f1',
  spouse: '#ec4899',
  sibling: '#10b981',
};

function layoutGraph(members: FamilyMember[], relationships: FamilyRelationship[]) {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', ranksep: 80, nodesep: 60 });

  members.forEach((m) => g.setNode(String(m.id), { width: 160, height: 80 }));
  relationships
    .filter((r) => r.relationship_type === 'parent_child')
    .forEach((r) => g.setEdge(String(r.person_a_id), String(r.person_b_id)));

  dagre.layout(g);

  return members.map((m) => {
    const pos = g.node(String(m.id));
    return {
      id: String(m.id),
      x: pos ? pos.x - 80 : m.position_x,
      y: pos ? pos.y - 40 : m.position_y,
    };
  });
}

interface TreeCanvasProps {
  members: FamilyMember[];
  relationships: FamilyRelationship[];
  onSelectMember: (m: FamilyMember) => void;
}

export function TreeCanvas({ members, relationships, onSelectMember }: TreeCanvasProps) {
  const positions = useMemo(() => layoutGraph(members, relationships), [members, relationships]);

  const initialNodes: Node[] = useMemo(
    () =>
      members.map((m, i) => ({
        id: String(m.id),
        type: 'member',
        position: { x: positions[i].x, y: positions[i].y },
        data: {
          label: [m.first_name, m.last_name].filter(Boolean).join(' '),
          birth_date: m.birth_date,
          death_date: m.death_date,
          onClick: () => onSelectMember(m),
        },
      })),
    [members, positions, onSelectMember]
  );

  const initialEdges: Edge[] = useMemo(
    () =>
      relationships.map((r) => ({
        id: String(r.id),
        source: String(r.person_a_id),
        target: String(r.person_b_id),
        label: r.relationship_type.replace('_', ' '),
        style: { stroke: EDGE_COLORS[r.relationship_type] ?? '#888' },
        labelStyle: { fontSize: 10, fill: '#888' },
      })),
    [relationships]
  );

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const onNodeClick = useCallback(() => {}, []);

  return (
    <div className="w-full h-[600px] rounded-lg border border-border overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}

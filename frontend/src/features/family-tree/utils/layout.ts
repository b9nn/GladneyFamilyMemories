import dagre from 'dagre'
import type { Node, Edge } from '@xyflow/react'
import type { FamilyMember, FamilyRelationship } from '@/types/api'

const NODE_WIDTH = 180
const NODE_HEIGHT = 100

export function buildLayout(
  members: FamilyMember[],
  relationships: FamilyRelationship[],
  useStoredPositions: boolean,
): { nodes: Node[]; edges: Edge[] } {
  const hasPositions = useStoredPositions && members.some((m) => m.position_x !== 0 || m.position_y !== 0)

  let nodes: Node[]

  if (hasPositions) {
    nodes = members.map((m) => ({
      id: String(m.id),
      type: 'familyMember',
      position: { x: m.position_x, y: m.position_y },
      data: m as unknown as Record<string, unknown>,
    }))
  } else {
    const g = new dagre.graphlib.Graph()
    g.setDefaultEdgeLabel(() => ({}))
    g.setGraph({ rankdir: 'TB', ranksep: 80, nodesep: 40 })

    for (const m of members) {
      g.setNode(String(m.id), { width: NODE_WIDTH, height: NODE_HEIGHT })
    }
    for (const r of relationships) {
      if (r.relationship_type === 'parent_child') {
        g.setEdge(String(r.person_a_id), String(r.person_b_id))
      }
    }
    dagre.layout(g)

    nodes = members.map((m) => {
      const node = g.node(String(m.id))
      return {
        id: String(m.id),
        type: 'familyMember',
        position: { x: (node?.x ?? 0) - NODE_WIDTH / 2, y: (node?.y ?? 0) - NODE_HEIGHT / 2 },
        data: m as unknown as Record<string, unknown>,
      }
    })
  }

  const edges: Edge[] = relationships.map((r) => ({
    id: `rel-${r.id}`,
    source: String(r.person_a_id),
    target: String(r.person_b_id),
    type: 'smoothstep',
    style: r.relationship_type === 'spouse'
      ? { strokeDasharray: '5 5', stroke: 'var(--color-primary)' }
      : r.relationship_type === 'sibling'
        ? { strokeDasharray: '2 4', stroke: 'var(--color-muted-foreground)' }
        : { stroke: 'var(--color-foreground)' },
    label: r.relationship_type === 'spouse' ? 'Spouse' : r.relationship_type === 'sibling' ? 'Sibling' : undefined,
    data: r as unknown as Record<string, unknown>,
  }))

  return { nodes, edges }
}

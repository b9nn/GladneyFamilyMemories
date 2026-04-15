import { useCallback, useMemo } from 'react'
import { ReactFlow, Background, Controls, type NodeChange, type Node, applyNodeChanges } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { LayoutGrid } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/shared/toast'
import { FamilyMemberNode } from './family-member-node'
import { buildLayout } from '../utils/layout'
import { useSaveLayout } from '../hooks/use-family-tree'
import type { FamilyTreeData } from '@/types/api'
import { useState } from 'react'

const nodeTypes = { familyMember: FamilyMemberNode }

interface TreeCanvasProps {
  data: FamilyTreeData
  isAdmin: boolean
}

export function TreeCanvas({ data, isAdmin }: TreeCanvasProps) {
  const { toast } = useToast()
  const saveLayout = useSaveLayout()

  const initial = useMemo(
    () => buildLayout(data.members, data.relationships, true),
    [data],
  )

  const [nodes, setNodes] = useState<Node[]>(initial.nodes)

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((nds) => applyNodeChanges(changes, nds))
  }, [])

  const handleAutoLayout = () => {
    const { nodes: laid } = buildLayout(data.members, data.relationships, false)
    setNodes(laid)
  }

  const handleSavePositions = async () => {
    const positions = nodes.map((n) => ({
      id: Number(n.id),
      position_x: Math.round(n.position.x),
      position_y: Math.round(n.position.y),
    }))
    try {
      await saveLayout.mutateAsync(positions)
      toast('Layout saved', 'success')
    } catch {
      toast('Failed to save layout', 'error')
    }
  }

  return (
    <div className="relative h-full">
      <ReactFlow
        nodes={nodes}
        edges={initial.edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        fitView
        minZoom={0.2}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <Controls />
      </ReactFlow>

      {isAdmin && (
        <div className="absolute top-3 right-3 flex gap-2 z-10">
          <Button variant="outline" size="sm" onClick={handleAutoLayout}>
            <LayoutGrid className="h-3.5 w-3.5" /> Auto Layout
          </Button>
          <Button size="sm" onClick={handleSavePositions} disabled={saveLayout.isPending}>
            {saveLayout.isPending ? 'Saving...' : 'Save Positions'}
          </Button>
        </div>
      )}
    </div>
  )
}

import { useState, useEffect } from "react"
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { Plus } from "lucide-react"
import { Button } from "./ui/button"
import { SortableIdea } from "./SortableIdea"
import { EditIdeaDialog } from "./modals/EditIdeaDialog"
import { IdeaType } from "@/types/idea"
import { useIdeaStore } from "@/store/ideaStore"
import CreateIdeaDialog from './modals/CreateIdeaDialog'

function IdeasWidget() {
  const { 
    ideas, 
    isLoading, 
    error,
    fetchIdeas, 
    addIdea, 
    updateIdea, 
    deleteIdea, 
    reorderIdeas 
  } = useIdeaStore()
  
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingIdea, setEditingIdea] = useState<IdeaType | null>(null)

  useEffect(() => {
    fetchIdeas()
  }, [fetchIdeas])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = ideas.findIndex((idea) => idea.id === active.id)
      const newIndex = ideas.findIndex((idea) => idea.id === over.id)

      const newIdeas = [...ideas]
      const [movedIdea] = newIdeas.splice(oldIndex, 1)
      newIdeas.splice(newIndex, 0, movedIdea)

      reorderIdeas(newIdeas)
    }
  }

  if (isLoading) {
    return (
      <div className="w-full bg-card border rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Ideas</h3>
        </div>
        <p className="text-sm text-muted-foreground">Loading ideas...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full bg-card border rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Ideas</h3>
        </div>
        <p className="text-sm text-red-500">Error: {error}</p>
      </div>
    )
  }

  return (
    <div className="w-full bg-card border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Ideas</h3>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={() => setIsCreateOpen(true)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={ideas}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {ideas.map((idea) => (
              <SortableIdea
                key={idea.id}
                {...idea}
                onUpdate={() => setEditingIdea(idea)}
                onDelete={deleteIdea}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <CreateIdeaDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onIdeaCreate={addIdea}
      />

      {editingIdea && (
        <EditIdeaDialog
          open={!!editingIdea}
          onOpenChange={(open) => !open && setEditingIdea(null)}
          idea={editingIdea}
          onIdeaUpdate={(idea) => {
            updateIdea(idea.id, idea)
            setEditingIdea(null)
          }}
        />
      )}
    </div>
  )
}

export default IdeasWidget 
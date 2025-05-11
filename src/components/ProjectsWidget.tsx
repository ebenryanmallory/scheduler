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
import { useProjectStore } from "@/store/projectStore"
import { SortableProject } from "./SortableProject"
import CreateProjectDialog from "./modals/CreateProjectDialog"

function ProjectsWidget() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { 
    isLoading, 
    error, 
    fetchProjects, 
    getDisplayProjects,
    reorderProjects
  } = useProjectStore()

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const displayProjects = getDisplayProjects()

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = displayProjects.findIndex((project) => project.id === active.id)
      const newIndex = displayProjects.findIndex((project) => project.id === over.id)

      const newProjects = [...displayProjects]
      const [movedProject] = newProjects.splice(oldIndex, 1)
      newProjects.splice(newIndex, 0, movedProject)

      // Update the order of each project
      const reorderedProjects = newProjects.map((project, index) => ({
        ...project,
        order: index,
      }))

      reorderProjects(reorderedProjects)
    }
  }

  if (isLoading) {
    return (
      <div className="w-full bg-card border rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Projects</h3>
        </div>
        <p className="text-sm text-muted-foreground">Loading projects...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full bg-card border rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Projects</h3>
        </div>
        <p className="text-sm text-red-500">Error: {error}</p>
      </div>
    )
  }

  return (
    <div className="w-full bg-card border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Projects</h3>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={() => setIsDialogOpen(true)}
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
          items={displayProjects}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {displayProjects.map((project) => (
              <SortableProject
                key={project.id}
                {...project}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      
      <CreateProjectDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
      />
    </div>
  )
}

export default ProjectsWidget 
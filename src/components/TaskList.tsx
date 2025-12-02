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
import { SortableTask } from "./SortableTasks"
import { useState, useEffect } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import { Button } from "./ui/button"
import { TaskListProps, ProjectGroup } from "@/types/taskList"
import { useProjectStore } from "@/store/projectStore"
import { useTaskSearch } from "@/hooks/useTaskSearch"
import { TaskSearchFilter } from "./TaskSearchFilter"

export function TaskList({ tasks, onTasksReorder, onTaskUpdate, onEdit, onDelete }: TaskListProps) {
  const { getDisplayProjects } = useProjectStore()
  const [expandedProject, setExpandedProject] = useState<string>("")

  // Search and filter functionality
  const {
    filteredTasks,
    filters,
    setSearch,
    setStatus,
    setPriority,
    setDateRange,
    clearFilters,
    hasActiveFilters,
    searchInputRef,
  } = useTaskSearch({ tasks })
  
  useEffect(() => {
    // Set first project as expanded by default
    const projects = getDisplayProjects()
    if (projects.length > 0) {
      setExpandedProject(projects[0].title)
    }
  }, [getDisplayProjects])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Get only the first two projects (morning and afternoon)
  const activeProjects = getDisplayProjects().slice(0, 2)

  // Use filtered tasks for display
  const projectGroups: ProjectGroup[] = activeProjects.map(project => ({
    name: project.title,
    persistentTasks: filteredTasks.filter(task => {
      const isPersistent = task.project === project.title && 
        task.persistent &&
        !task.completed;
      return isPersistent;
    }),
    regularTasks: filteredTasks.filter(task => {
      const isRegular = task.project === project.title && 
        (!task.persistent || task.completed);
      return isRegular;
    })
  }))

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const allTasks = [...tasks]
      const oldIndex = allTasks.findIndex((task) => task.id === active.id)
      const newIndex = allTasks.findIndex((task) => task.id === over.id)

      const [movedTask] = allTasks.splice(oldIndex, 1)
      allTasks.splice(newIndex, 0, movedTask)

      onTasksReorder(allTasks)
    }
  }

  const toggleProject = (projectName: string) => {
    setExpandedProject(expandedProject === projectName ? "" : projectName)
  }

  return (
    <div className="flex-1 min-w-[320px] max-w-md">
      {/* Search and Filter UI */}
      <TaskSearchFilter
        filters={filters}
        onSearchChange={setSearch}
        onStatusChange={setStatus}
        onPriorityChange={setPriority}
        onDateRangeChange={setDateRange}
        onClearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
        searchInputRef={searchInputRef}
        resultCount={filteredTasks.length}
        totalCount={tasks.length}
      />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-4 mt-4">
          {projectGroups
          .filter(group => {
            const hasItems = group.persistentTasks.length > 0 || group.regularTasks.length > 0;
            return hasItems;
          })
          .map((group) => (
            <div key={group.name} className="border rounded-lg p-2">
              <Button
                variant="ghost"
                className="w-full flex justify-between items-center p-2"
                onClick={() => toggleProject(group.name)}
              >
                <span className="font-semibold">
                  {group.name} ({group.persistentTasks.length + group.regularTasks.length})
                </span>
                {expandedProject === group.name ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
              
              {expandedProject === group.name && (
                <SortableContext
                  items={[...group.persistentTasks, ...group.regularTasks]}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2 mt-2">
                    {/* Render persistent tasks first */}
                    {group.persistentTasks.length > 0 && (
                      <div className="mb-4">
                        <div className="text-sm text-muted-foreground mb-2">Longer timeline goals</div>
                        {group.persistentTasks.map((task) => (
                          <SortableTask
                            key={task.id}
                            {...task}
                            onTaskUpdate={onTaskUpdate}
                            onEdit={onEdit}
                            onDelete={onDelete}
                          />
                        ))}
                      </div>
                    )}
                    {/* Render regular tasks */}
                    {group.regularTasks.length > 0 && (
                      <div>
                        <div className="text-sm text-muted-foreground mb-2">Daily</div>
                        {group.regularTasks.map((task) => (
                          <SortableTask
                            key={task.id}
                            {...task}
                            onTaskUpdate={onTaskUpdate}
                            onEdit={onEdit}
                            onDelete={onDelete}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </SortableContext>
              )}
            </div>
          ))}
        </div>
      </DndContext>
    </div>
  )
}

export default TaskList 
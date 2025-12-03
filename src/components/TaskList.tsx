/**
 * TaskList Component
 * Displays tasks grouped by project with drag-and-drop support
 * Works within the DragDropScheduleProvider context for cross-container dragging
 */

import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { useDroppable } from "@dnd-kit/core"
import { SortableTask } from "./SortableTasks"
import { useState, useEffect } from "react"
import { ChevronDown, ChevronRight, Inbox } from "lucide-react"
import { Button } from "./ui/button"
import { TaskListProps, ProjectGroup } from "@/types/taskList"
import { useProjectStore } from "@/store/projectStore"
import { useTaskSearch } from "@/hooks/useTaskSearch"
import { TaskSearchFilter } from "./TaskSearchFilter"

/**
 * TaskListDropZone - Droppable area for unscheduling tasks
 */
function TaskListDropZone({ children }: { children: React.ReactNode }) {
  const { isOver, setNodeRef, active } = useDroppable({
    id: 'task-list-drop-zone',
    data: {
      type: 'task-list',
      accepts: ['task'],
    },
  })

  const isDragActive = !!active

  return (
    <div
      ref={setNodeRef}
      className={`
        flex-1 min-w-[320px] max-w-md transition-all duration-150
        ${isDragActive ? 'ring-2 ring-dashed ring-muted-foreground/30 rounded-lg' : ''}
        ${isOver ? 'ring-2 ring-primary ring-solid bg-primary/5 rounded-lg' : ''}
      `}
    >
      {children}
      
      {/* Drop indicator when dragging over */}
      {isOver && (
        <div className="mt-4 p-4 border-2 border-dashed border-primary/50 rounded-lg bg-primary/5 text-center">
          <Inbox className="h-5 w-5 mx-auto mb-2 text-primary" />
          <span className="text-sm text-primary font-medium">Drop to unschedule</span>
        </div>
      )}
    </div>
  )
}

export function TaskList({ tasks, onTaskUpdate, onEdit, onDelete }: TaskListProps) {
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

  const toggleProject = (projectName: string) => {
    setExpandedProject(expandedProject === projectName ? "" : projectName)
  }

  // Get all task IDs for sortable context
  const allTaskIds = filteredTasks.map(task => task.id)

  return (
    <TaskListDropZone>
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

      {/* SortableContext for reordering - uses parent DndContext */}
      <SortableContext
        items={allTaskIds}
        strategy={verticalListSortingStrategy}
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
                )}
              </div>
            ))}
        </div>
      </SortableContext>
      
      {/* Empty state */}
      {projectGroups.every(g => g.persistentTasks.length === 0 && g.regularTasks.length === 0) && (
        <div className="mt-8 text-center py-8 border-2 border-dashed rounded-lg">
          <Inbox className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">No tasks found</p>
          {hasActiveFilters && (
            <Button 
              variant="link" 
              onClick={clearFilters}
              className="mt-2"
            >
              Clear filters
            </Button>
          )}
        </div>
      )}
    </TaskListDropZone>
  )
}

export default TaskList

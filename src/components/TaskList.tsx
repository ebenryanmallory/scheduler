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
import { TaskType } from "@/types/task"
import { SortableTask } from "./SortableTasks"
import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import { Button } from "./ui/button"
import { EditTaskDialog } from './EditTaskDialog'
import { TaskListProps, ProjectGroup } from "@/types/taskList"

export function TaskList({ tasks, onTasksReorder, onTaskUpdate, onEdit, onDelete }: TaskListProps) {
  const [expandedProject, setExpandedProject] = useState<string>("Dynamic Momentum")
  const [editingTask, setEditingTask] = useState<TaskType | null>(null)
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Group tasks by project, separating persistent and regular tasks
  const projectGroups: ProjectGroup[] = [
    {
      name: "Dynamic Momentum",
      persistentTasks: tasks.filter(task => 
        task.project === "Dynamic Momentum" && 
        task.persistent &&
        !task.completed
      ),
      regularTasks: tasks.filter(task => 
        task.project === "Dynamic Momentum" && 
        (!task.persistent || task.completed)
      )
    },
    {
      name: "Motion Storyline",
      persistentTasks: tasks.filter(task => 
        task.project === "Motion Storyline" && 
        task.persistent &&
        !task.completed
      ),
      regularTasks: tasks.filter(task => 
        task.project === "Motion Storyline" && 
        (!task.persistent || task.completed)
      )
    }
  ]

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

  const handleEdit = (task: TaskType) => {
    setEditingTask(task)
  }

  const handleCloseEdit = () => {
    setEditingTask(null)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-4">
        {projectGroups
          .filter(group => group.persistentTasks.length > 0 || group.regularTasks.length > 0)
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
                            onEdit={handleEdit}
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
                            onEdit={handleEdit}
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

      {editingTask && (
        <EditTaskDialog 
          task={editingTask} 
          open={!!editingTask}
          onTaskUpdate={(updatedTask: TaskType) => {
            if (onTaskUpdate) {
              onTaskUpdate(updatedTask)
            }
          }}
          onSubmit={(updatedTask: TaskType) => {
            if (onTaskUpdate) {
              onTaskUpdate(updatedTask)
            }
            handleCloseEdit();
          }}
          onOpenChange={(open) => {
            if (!open) handleCloseEdit();
          }}
        />
      )}
    </DndContext>
  )
}

export default TaskList 
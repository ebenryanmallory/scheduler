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

interface TaskListProps {
  tasks: TaskType[]
  onTasksReorder: (tasks: TaskType[]) => void
  onUpdate?: (task: TaskType) => void
  onDelete?: (id: string) => void
}

interface ProjectGroup {
  name: string
  tasks: TaskType[]
}

export function TaskList({ tasks, onTasksReorder, onUpdate, onDelete }: TaskListProps) {
  const [expandedProject, setExpandedProject] = useState<string>("Dynamic Momentum")
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Separate persistent tasks that aren't completed
  const persistentTasks = tasks.filter(task => task.persistent && !task.completed)
  
  // Group remaining tasks by project (excluding persistent tasks to avoid duplicates)
  const projectGroups: ProjectGroup[] = [
    {
      name: "Persistent Tasks",
      tasks: persistentTasks
    },
    {
      name: "Dynamic Momentum",
      tasks: tasks.filter(task => 
        task.project === "Dynamic Momentum" && 
        (!task.persistent || task.completed)
      )
    },
    {
      name: "Motion Storyline",
      tasks: tasks.filter(task => 
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

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-4">
        {projectGroups
          .filter(group => group.tasks.length > 0)
          .map((group) => (
            <div key={group.name} className="border rounded-lg p-2">
              <Button
                variant="ghost"
                className="w-full flex justify-between items-center p-2"
                onClick={() => toggleProject(group.name)}
              >
                <span className="font-semibold">
                  {group.name} ({group.tasks.length})
                </span>
                {expandedProject === group.name ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
              
              {expandedProject === group.name && (
                <SortableContext
                  items={group.tasks}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2 mt-2">
                    {group.tasks.map((task) => (
                      <SortableTask
                        key={task.id}
                        {...task}
                        onUpdate={onUpdate}
                        onDelete={onDelete}
                      />
                    ))}
                  </div>
                </SortableContext>
              )}
            </div>
          ))}
      </div>
    </DndContext>
  )
}

export default TaskList 
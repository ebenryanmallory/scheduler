import { ProjectName } from "@/store/projectStore"

export interface IdeaType {
  id: string
  title: string
  description?: string
  project?: ProjectName
  createdAt: Date
}

export interface IdeasWidgetProps {
  ideas: IdeaType[]
  onIdeaCreate: (idea: Omit<IdeaType, 'id' | 'createdAt'>) => void
  onIdeaUpdate: (id: string, idea: Partial<IdeaType>) => void
  onIdeaDelete: (id: string) => void
  onIdeasReorder: (ideas: IdeaType[]) => void
} 
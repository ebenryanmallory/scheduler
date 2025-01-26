import { ProjectName } from "@/store/projectStore"

export interface TaskType {
  id: string;
  title: string;
  description?: string;
  date: Date;
  timeBlock?: number;
  time?: string;
  project?: ProjectName;
  persistent?: boolean;
  completed?: boolean;
  scheduledTime?: string;
} 
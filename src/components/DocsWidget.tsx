import { useState } from "react"
import { BookOpen } from "lucide-react"
import { Button } from "./ui/button"
import DocsDialog from "./modals/DocsDialog"
import type { Project } from "@/types/project"

interface DocsWidgetProps {
  project: Project
}

function DocsWidget({ project }: DocsWidgetProps) {
  const [isDocsOpen, setIsDocsOpen] = useState(false)

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsDocsOpen(true)}
        className="w-full"
      >
        <BookOpen className="h-4 w-4 mr-2" />
        {project.title} Docs
      </Button>

      <DocsDialog
        open={isDocsOpen}
        onOpenChange={setIsDocsOpen}
        projectId={project.id}
        projectTitle={project.title}
      />
    </>
  )
}

export default DocsWidget

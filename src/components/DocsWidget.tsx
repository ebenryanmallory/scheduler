import { useState } from "react"
import { BookOpen } from "lucide-react"
import { Button } from "./ui/button"
import DocsDialog from "./modals/DocsDialog"

function DocsWidget() {
  const [isDocsOpen, setIsDocsOpen] = useState(false)

  return (
    <div className="w-full bg-card border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Project Docs</h3>
      </div>

      <Button
        variant="outline"
        onClick={() => setIsDocsOpen(true)}
        className="w-full"
      >
        <BookOpen className="h-4 w-4 mr-2" />
        View Details
      </Button>

      <DocsDialog
        open={isDocsOpen}
        onOpenChange={setIsDocsOpen}
      />
    </div>
  )
}

export default DocsWidget

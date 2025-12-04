import { useState, useEffect } from "react"
import { BookOpen } from "lucide-react"
import { Button } from "./ui/button"
import DocsDialog from "./modals/DocsDialog"
import ProjectProgress, { ProjectProgressData } from "./ProjectProgress"

function DocsWidget() {
  const [isDocsOpen, setIsDocsOpen] = useState(false)
  const [progressData, setProgressData] = useState<ProjectProgressData | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchProgress()
  }, [])

  const fetchProgress = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('http://localhost:3001/api/docs/progress')
      const data = await response.json()
      setProgressData(data)
    } catch (err) {
      console.error('Failed to fetch progress:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full bg-card border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Project Progress</h3>
        {progressData && (
          <span className="text-sm text-muted-foreground tabular-nums">
            {progressData.overallPercent}%
          </span>
        )}
      </div>

      {/* Compact Progress Display */}
      <div className="mb-4">
        <ProjectProgress data={progressData} isLoading={isLoading} compact />
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


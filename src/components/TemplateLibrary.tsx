/**
 * TemplateLibrary Component (AC6)
 * Displays and manages task templates
 */

import { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { ScrollArea } from './ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import {
  Search,
  Plus,
  MoreVertical,
  Download,
  Upload,
  Trash2,
  FileText,
  Clock,
  Repeat,
  Star,
} from 'lucide-react'
import { useTemplateStore } from '@/store/templateStore'
import { TaskTemplate, TemplateExport } from '@/types/recurrence'
import { describeRecurrence, configToRRuleString } from '@/lib/recurrence'
import toast from 'react-hot-toast'

interface TemplateLibraryProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectTemplate: (template: TaskTemplate) => void
}

export function TemplateLibrary({
  open,
  onOpenChange,
  onSelectTemplate,
}: TemplateLibraryProps) {
  const {
    templates,
    deleteTemplate,
    exportTemplates,
    importTemplates,
  } = useTemplateStore()

  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>()
    templates.forEach((t) => {
      if (t.category) cats.add(t.category)
    })
    return Array.from(cats).sort()
  }, [templates])

  // Filter templates
  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      const matchesSearch = !search || 
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.description?.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = !selectedCategory || t.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [templates, search, selectedCategory])

  // Group templates by category
  const groupedTemplates = useMemo(() => {
    const groups: Record<string, TaskTemplate[]> = {}
    filteredTemplates.forEach((t) => {
      const cat = t.category || 'Uncategorized'
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(t)
    })
    return groups
  }, [filteredTemplates])

  // Handle export
  const handleExport = () => {
    const data = exportTemplates()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `task-templates-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Templates exported successfully')
  }

  // Handle import
  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (readerEvent: ProgressEvent<FileReader>) => {
        try {
          const data = JSON.parse(readerEvent.target?.result as string) as TemplateExport
          const result = importTemplates(data)
          toast.success(`Imported ${result.imported} templates (${result.skipped} skipped)`)
        } catch (error) {
          toast.error('Failed to import templates. Invalid file format.')
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  // Handle template selection
  const handleSelect = (template: TaskTemplate) => {
    onSelectTemplate(template)
    onOpenChange(false)
  }

  // Handle template deletion
  const handleDelete = (template: TaskTemplate) => {
    if (template.isBuiltIn) {
      toast.error('Cannot delete built-in templates')
      return
    }
    deleteTemplate(template.id)
    toast.success('Template deleted')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Template Library
          </DialogTitle>
          <DialogDescription>
            Choose a template to quickly create a task, or manage your templates.
          </DialogDescription>
        </DialogHeader>

        {/* Toolbar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button variant="outline" size="icon" onClick={handleImport} title="Import templates">
            <Upload className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleExport} title="Export templates">
            <Download className="h-4 w-4" />
          </Button>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 flex-wrap">
          <Badge
            variant={selectedCategory === null ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setSelectedCategory(null)}
          >
            All
          </Badge>
          {categories.map((cat) => (
            <Badge
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </Badge>
          ))}
        </div>

        {/* Template list */}
        <ScrollArea className="flex-1">
          <div className="space-y-4 pr-4">
            {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
              <div key={category}>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">{category}</h3>
                <div className="space-y-2">
                  {categoryTemplates.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      onSelect={() => handleSelect(template)}
                      onDelete={() => handleDelete(template)}
                    />
                  ))}
                </div>
              </div>
            ))}

            {filteredTemplates.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No templates found</p>
                {search && (
                  <Button
                    variant="link"
                    onClick={() => setSearch('')}
                    className="mt-2"
                  >
                    Clear search
                  </Button>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

interface TemplateCardProps {
  template: TaskTemplate
  onSelect: () => void
  onDelete: () => void
}

function TemplateCard({ template, onSelect, onDelete }: TemplateCardProps) {
  const recurrenceText = template.taskDefaults.recurrence
    ? describeRecurrence(
        configToRRuleString(template.taskDefaults.recurrence, new Date())
      )
    : null

  return (
    <div
      className="p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
      onClick={onSelect}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-sm truncate">{template.name}</h4>
            {template.isBuiltIn && (
              <Star className="h-3 w-3 text-amber-500 flex-shrink-0" />
            )}
          </div>
          {template.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
              {template.description}
            </p>
          )}
          <div className="flex items-center gap-3 mt-2">
            {template.taskDefaults.estimatedDuration && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {template.taskDefaults.estimatedDuration}m
              </span>
            )}
            {recurrenceText && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Repeat className="h-3 w-3" />
                {recurrenceText}
              </span>
            )}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSelect(); }}>
              <Plus className="h-4 w-4 mr-2" />
              Use Template
            </DropdownMenuItem>
            {!template.isBuiltIn && (
              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

export default TemplateLibrary


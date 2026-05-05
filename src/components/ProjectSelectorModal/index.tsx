'use client'

import { useState } from 'react'
import { X, FolderOpen, Plus, ChevronRight } from 'lucide-react'
import { useProjectStore } from '@/stores/projectStore'
import NewProjectModal from '@/components/NewProjectModal'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSelect: (projectId: string) => void
}

export default function ProjectSelectorModal({ isOpen, onClose, onSelect }: Props) {
  const { projects } = useProjectStore()
  const [showNewProject, setShowNewProject] = useState(false)

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
        <div className="bg-vrd-card border border-vrd-border rounded-xl max-w-sm w-full shadow-2xl animate-fade-up">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-vrd-border">
            <div>
              <h2 className="text-sm font-semibold text-vrd-text">Choose a project</h2>
              <p className="text-[11px] text-vrd-text-muted mt-0.5">Where should this conversation be saved?</p>
            </div>
            <button onClick={onClose} className="text-vrd-text-muted hover:text-vrd-text transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Project list */}
          <div className="py-1.5 max-h-64 overflow-y-auto">
            {projects.length === 0 ? (
              <p className="text-xs text-vrd-text-muted text-center py-6 px-4">
                No projects yet. Create one below.
              </p>
            ) : (
              projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => onSelect(project.id)}
                  className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-vrd-card-hover transition-colors group"
                >
                  <FolderOpen className="w-4 h-4 text-vrd-text-muted flex-shrink-0 group-hover:text-primary-light transition-colors" />
                  <span className="flex-1 text-sm text-vrd-text truncate">{project.name}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-vrd-text-dim opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))
            )}
          </div>

          {/* New project */}
          <div className="border-t border-vrd-border p-3">
            <button
              onClick={() => setShowNewProject(true)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-vrd-text-muted hover:text-vrd-text hover:bg-vrd-card-hover transition-colors"
            >
              <Plus className="w-4 h-4 flex-shrink-0" />
              New project
            </button>
          </div>
        </div>
      </div>

      <NewProjectModal
        isOpen={showNewProject}
        onClose={() => setShowNewProject(false)}
      />
    </>
  )
}

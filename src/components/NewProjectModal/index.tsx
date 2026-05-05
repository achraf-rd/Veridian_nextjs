'use client'

import { useState } from 'react'
import { X, Plus, AlertCircle } from 'lucide-react'
import { useProjectStore } from '@/stores/projectStore'
import { Button } from '@/components/ui'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function NewProjectModal({ isOpen, onClose }: Props) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { addProject, projects } = useProjectStore()

  const handleCreate = async () => {
    const trimmed = name.trim()
    if (!trimmed) return

    const duplicate = projects.some(
      (p) => p.name.toLowerCase() === trimmed.toLowerCase()
    )
    if (duplicate) {
      setError('A project with this name already exists.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      await addProject(trimmed, description.trim() || undefined)
      setName('')
      setDescription('')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project.')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleCreate() }
    if (e.key === 'Escape') onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-vrd-card border border-vrd-border rounded-xl max-w-md w-full p-6 space-y-4 animate-fade-up">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-vrd-text flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            New Project
          </h2>
          <button onClick={onClose} className="text-vrd-text-muted hover:text-vrd-text transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-vrd-text-muted mb-2">
              Project Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(null) }}
              onKeyDown={handleKeyDown}
              placeholder="e.g., Tesla Autopilot v3"
              className={`w-full px-3 py-2 rounded-lg bg-vrd-bg border text-vrd-text text-sm focus:outline-none placeholder:text-vrd-text-dim transition-colors ${
                error ? 'border-danger/60 focus:border-danger/80' : 'border-vrd-border focus:border-primary/50'
              }`}
              autoFocus
            />
            {error && (
              <p className="flex items-center gap-1.5 mt-1.5 text-xs text-danger">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {error}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-vrd-text-muted mb-2">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe the validation campaign..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-vrd-bg border border-vrd-border text-vrd-text text-sm focus:outline-none focus:border-primary/50 placeholder:text-vrd-text-dim resize-none font-mono"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-vrd-border text-vrd-text-muted hover:text-vrd-text text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <Button onClick={handleCreate} disabled={!name.trim() || loading} className="flex-1">
            {loading ? 'Creating…' : 'Create'}
          </Button>
        </div>
      </div>
    </div>
  )
}

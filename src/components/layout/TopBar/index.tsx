'use client'

import { useParams } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { useProjectStore } from '@/stores/projectStore'
import { ThemeToggle } from '@/components/ui'

export default function TopBar() {
  const params = useParams() as { projectId?: string; conversationId?: string } | null
  const projectId = params?.projectId ?? ''
  const convId = params?.conversationId ?? ''

  const { projects, conversations } = useProjectStore()
  const project = projects.find((p) => p.id === projectId)
  const conversation = conversations[convId]

  return (
    <header className="flex items-center h-12 px-4 border-b border-vrd-border bg-vrd-sidebar flex-shrink-0 justify-between">
      <nav className="flex items-center gap-1 text-xs text-vrd-text-muted">
        <span className="hover:text-vrd-text transition-colors cursor-pointer">
          {project?.name ?? projectId}
        </span>
        {conversation && (
          <>
            <ChevronRight className="w-3 h-3" />
            <span className="text-vrd-text truncate max-w-xs">{conversation.title}</span>
          </>
        )}
      </nav>
      <ThemeToggle />
    </header>
  )
}

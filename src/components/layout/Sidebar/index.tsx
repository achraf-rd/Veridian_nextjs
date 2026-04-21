'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import { ChevronDown, ChevronRight, MessageSquare, Plus, FolderOpen } from 'lucide-react'
import { useProjectStore } from '@/stores/projectStore'
import NewProjectModal from '@/components/NewProjectModal'
import { cn } from '@/lib/utils'

export default function Sidebar() {
  const params = useParams() as { projectId?: string; conversationId?: string } | null
  const router = useRouter()
  const activeProjectId = params?.projectId ?? ''
  const activeConvId = params?.conversationId ?? ''
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false)

  const { projects, expandedProjects, toggleProject, getConversationsForProject, addConversation } = useProjectStore()

  const handleNewConversation = (projectId: string) => {
    const conversationId = `conv-${Date.now()}`
    addConversation(projectId, {
      id: conversationId,
      projectId,
      title: 'New conversation',
      createdAt: new Date().toISOString(),
    })
    router.push(`/project/${projectId}/conversation/${conversationId}`)
  }

  return (
    <>
      <aside className="w-60 flex-shrink-0 flex flex-col bg-vrd-sidebar border-r border-vrd-border h-full">

        {/* Brand */}
        <div className="px-4 py-4 border-b border-vrd-border">
          <div className="flex items-center gap-2.5">
            <Image
              src="/Veridian-logo.png"
              alt="Veridian"
              width={24}
              height={24}
              className="object-contain rounded-lg"
            />
            <span className="font-semibold text-sm text-vrd-text tracking-tight">Veridian</span>
          </div>
          <p className="text-[10px] text-vrd-text-dim mt-1 ml-5 pl-3.5">ADAS Validation Platform</p>
        </div>

        {/* Projects header + new project */}
        <div className="flex items-center justify-between px-4 pt-4 pb-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-vrd-text-dim">Projects</span>
          <button
            onClick={() => setIsNewProjectOpen(true)}
            title="New project"
            className="flex items-center gap-1 text-[10px] text-vrd-text-dim hover:text-primary-light transition-colors"
          >
            <Plus className="w-3 h-3" />
            New
          </button>
        </div>

        {/* Project list */}
        <nav className="flex-1 overflow-y-auto px-2 space-y-0.5 pb-3">
          {projects.map((project) => {
            const isExpanded = expandedProjects.has(project.id)
            const conversations = getConversationsForProject(project.id)

            return (
              <div key={project.id}>
                <button
                  onClick={() => toggleProject(project.id)}
                  className={cn(
                    'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium transition-colors',
                    activeProjectId === project.id
                      ? 'text-vrd-text'
                      : 'text-vrd-text-muted hover:text-vrd-text hover:bg-vrd-card-hover',
                  )}
                >
                  <FolderOpen className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="flex-1 text-left truncate">{project.name}</span>
                  {isExpanded
                    ? <ChevronDown className="w-3 h-3 flex-shrink-0 opacity-50" />
                    : <ChevronRight className="w-3 h-3 flex-shrink-0 opacity-50" />}
                </button>

                {isExpanded && (
                  <div className="ml-4 mt-0.5 space-y-0.5 border-l border-vrd-border pl-2">
                    {conversations.map((conv) => (
                      <Link
                        key={conv.id}
                        href={`/project/${project.id}/conversation/${conv.id}`}
                        className={cn(
                          'flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors',
                          activeConvId === conv.id
                            ? 'bg-primary/10 text-primary-light border border-primary/20'
                            : 'text-vrd-text-muted hover:text-vrd-text hover:bg-vrd-card-hover',
                        )}
                      >
                        <MessageSquare className="w-3 h-3 flex-shrink-0 opacity-60" />
                        <span className="truncate">{conv.title}</span>
                      </Link>
                    ))}
                    <button
                      onClick={() => handleNewConversation(project.id)}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-vrd-text-dim hover:text-vrd-text-muted transition-colors w-full"
                    >
                      <Plus className="w-3 h-3" />
                      New conversation
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* Footer — Powered by Capgemini */}
        <div className="border-t border-vrd-border px-4 py-3 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center text-[10px] font-semibold text-primary-light flex-shrink-0">
              E
            </div>
            <span className="text-xs text-vrd-text-muted truncate">ADAS Engineer</span>
          </div>
          <div className="space-y-1.5">
            <p className="text-[9px] font-semibold uppercase tracking-wider text-vrd-text-dim">Powered by</p>
            <Image
              src="/capgemini-logo.png"
              alt="Capgemini"
              width={120}
              height={24}
              className="object-contain h-auto ml-5"
            />
          </div>
        </div>
      </aside>

      <NewProjectModal isOpen={isNewProjectOpen} onClose={() => setIsNewProjectOpen(false)} />
    </>
  )
}

'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import { ChevronDown, ChevronRight, MessageSquare, Plus, FolderOpen, Settings, LogOut, ChevronUp } from 'lucide-react'
import { useProjectStore } from '@/stores/projectStore'
import NewProjectModal from '@/components/NewProjectModal'
import { cn } from '@/lib/utils'

const USER = {
  name: 'Achraf Rachid',
  email: 'achraf.rachid@capgemini.com',
  initials: 'AR',
  role: 'ADAS Validation Engineer',
}

export default function Sidebar() {
  const params = useParams() as { projectId?: string; conversationId?: string } | null
  const router = useRouter()
  const activeProjectId = params?.projectId ?? ''
  const activeConvId = params?.conversationId ?? ''
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!userMenuOpen) return
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [userMenuOpen])

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

        {/* Footer — User profile */}
        <div className="border-t border-vrd-border px-3 py-2 space-y-2">
          {/* User menu popup — renders above the button */}
          <div className="relative" ref={userMenuRef}>
            {userMenuOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-vrd-card border border-vrd-border rounded-xl shadow-2xl overflow-hidden z-50">
                <div className="px-3 py-2.5 border-b border-vrd-border">
                  <p className="text-xs font-semibold text-vrd-text leading-tight">{USER.name}</p>
                  <p className="text-[10px] text-vrd-text-dim mt-0.5 truncate">{USER.email}</p>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => { setUserMenuOpen(false); router.push('/settings') }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-vrd-text-muted hover:text-vrd-text hover:bg-vrd-card-hover transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5 flex-shrink-0" />
                    Settings
                  </button>
                </div>
                <div className="border-t border-vrd-border py-1">
                  <button
                    onClick={() => setUserMenuOpen(false)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-vrd-text-muted hover:text-danger hover:bg-danger/5 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
                    Sign out
                  </button>
                </div>
              </div>
            )}

            {/* User row button */}
            <button
              onClick={() => setUserMenuOpen((v) => !v)}
              className={cn(
                'w-full flex items-center gap-2.5 px-2 py-2 rounded-lg transition-colors group',
                userMenuOpen ? 'bg-vrd-card-hover' : 'hover:bg-vrd-card-hover',
              )}
            >
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-[11px] font-semibold text-white flex-shrink-0">
                {USER.initials}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-xs font-medium text-vrd-text truncate leading-tight">{USER.name}</p>
                <p className="text-[10px] text-vrd-text-dim truncate">{USER.role}</p>
              </div>
              {userMenuOpen
                ? <ChevronUp className="w-3 h-3 text-vrd-text-dim flex-shrink-0" />
                : <ChevronDown className="w-3 h-3 text-vrd-text-dim flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              }
            </button>
          </div>

          <div className="space-y-1.5">
            <p className="text-[9px] font-semibold uppercase tracking-wider text-vrd-text-dim px-2">Powered by</p>
            <Image
              src="/capgemini-logo.png"
              alt="Capgemini"
              width={120}
              height={24}
              className="object-contain h-auto ml-7"
            />
          </div>
        </div>
      </aside>

      <NewProjectModal isOpen={isNewProjectOpen} onClose={() => setIsNewProjectOpen(false)} />
    </>
  )
}

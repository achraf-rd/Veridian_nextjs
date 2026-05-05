'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import {
  ChevronDown, ChevronRight, MessageSquare, Plus, FolderOpen,
  Settings, LogOut, ChevronUp, MoreHorizontal, Pencil, Trash2, Check, X,
} from 'lucide-react'
import { useProjectStore } from '@/stores/projectStore'
import { usePipelineStore } from '@/stores/pipelineStore'
import NewProjectModal from '@/components/NewProjectModal'
import { cn } from '@/lib/utils'

// Typewriter animation: types out title char-by-char when it changes from "New conversation"
function ConvTitle({ title }: { title: string }) {
  const [displayed, setDisplayed] = useState(title)
  const prevRef = useRef(title)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (prevRef.current === title) return
    const prev = prevRef.current
    prevRef.current = title

    if (timerRef.current) clearInterval(timerRef.current)

    // Only animate when going from the default placeholder to a real name
    if (prev !== 'New conversation' && prev !== '') {
      setDisplayed(title)
      return
    }

    setDisplayed('')
    let i = 0
    timerRef.current = setInterval(() => {
      i++
      setDisplayed(title.slice(0, i))
      if (i >= title.length) {
        clearInterval(timerRef.current!)
        timerRef.current = null
      }
    }, 28)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [title])

  return <span className="truncate">{displayed}</span>
}

const USER = {
  name: 'Achraf Rachid',
  email: 'achraf.rachid@capgemini.com',
  initials: 'AR',
  role: 'ADAS Validation Engineer',
}

// Renders children in a fixed-position portal so overflow:auto parents never clip it
function FloatingMenu({
  anchorRect,
  align = 'left',
  onClose,
  children,
}: {
  anchorRect: DOMRect | null
  align?: 'left' | 'right'
  onClose: () => void
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!anchorRect) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [anchorRect, onClose])

  if (!anchorRect || typeof document === 'undefined') return null

  const style: React.CSSProperties = {
    position: 'fixed',
    top: anchorRect.bottom + 4,
    zIndex: 9999,
    ...(align === 'left' ? { left: anchorRect.left } : { right: window.innerWidth - anchorRect.right }),
  }

  return createPortal(
    <div ref={ref} style={style}>
      {children}
    </div>,
    document.body,
  )
}

type MenuState = { kind: 'project' | 'conv'; id: string; rect: DOMRect } | null
type DeleteTarget = { kind: 'project' | 'conv'; id: string; label: string } | null
type RenameTarget = { kind: 'project' | 'conv'; id: string; value: string } | null

export default function Sidebar() {
  const params = useParams() as { projectId?: string; conversationId?: string } | null
  const router = useRouter()
  const activeProjectId = params?.projectId ?? ''
  const activeConvId = params?.conversationId ?? ''

  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [menu, setMenu] = useState<MenuState>(null)
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null)
  const [renaming, setRenaming] = useState<RenameTarget>(null)

  const userMenuRef = useRef<HTMLDivElement>(null)
  const renameInputRef = useRef<HTMLInputElement>(null)

  const {
    projects, conversations, expandedProjects, hasHydrated, toggleProject,
    getConversationsForProject, hydrate,
    renameProject, deleteProject, renameConversation, deleteConversation,
  } = useProjectStore()
  const { getPipeline } = usePipelineStore()

  // Load projects on mount
  useEffect(() => { hydrate() }, [hydrate])

  // Close user menu on outside click
  useEffect(() => {
    if (!userMenuOpen) return
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node))
        setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [userMenuOpen])

  // Focus rename input when it mounts
  useEffect(() => {
    if (renaming) renameInputRef.current?.select()
  }, [renaming])

  const handleNewConversation = (projectId: string) => {
    router.push(`/project/${projectId}/new`)
  }

  const openMenu = useCallback((e: React.MouseEvent<HTMLButtonElement>, kind: 'project' | 'conv', id: string) => {
    e.stopPropagation()
    e.preventDefault()
    const rect = e.currentTarget.getBoundingClientRect()
    setMenu((prev) => (prev?.id === id ? null : { kind, id, rect }))
    setDeleteTarget(null)
  }, [])

  const closeMenu = useCallback(() => {
    setMenu(null)
    setDeleteTarget(null)
  }, [])

  const startRename = (kind: 'project' | 'conv', id: string, currentName: string) => {
    closeMenu()
    setRenaming({ kind, id, value: currentName })
  }

  const commitRename = async () => {
    if (!renaming) return
    const val = renaming.value.trim()
    if (val) {
      if (renaming.kind === 'project') await renameProject(renaming.id, val).catch(() => {})
      else await renameConversation(renaming.id, val).catch(() => {})
    }
    setRenaming(null)
  }

  const handleRenameKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commitRename()
    if (e.key === 'Escape') setRenaming(null)
  }

  const confirmDelete = (kind: 'project' | 'conv', id: string, label: string) => {
    setDeleteTarget({ kind, id, label })
  }

  const executeDelete = async () => {
    if (!deleteTarget) return
    const target = deleteTarget
    closeMenu()
    if (target.kind === 'project') {
      if (activeProjectId === target.id) router.push('/')
      await deleteProject(target.id).catch(() => {})
    } else {
      if (activeConvId === target.id) {
        const conv = projects
          .flatMap((p) => getConversationsForProject(p.id))
          .find((c) => c.id !== target.id)
        router.push(conv ? `/project/${conv.projectId}/conversation/${conv.id}` : '/')
      }
      await deleteConversation(target.id).catch(() => {})
    }
  }

  const menuContent = menu && (
    !deleteTarget ? (
      <div className="w-36 bg-vrd-card border border-vrd-border rounded-lg shadow-2xl overflow-hidden py-1">
        <button
          onClick={() => {
            const name = menu.kind === 'project'
              ? projects.find((p) => p.id === menu.id)?.name ?? ''
              : conversations[menu.id]?.title ?? ''
            startRename(menu.kind, menu.id, name)
          }}
          className="flex items-center gap-2 w-full px-3 py-2 text-xs text-vrd-text-muted hover:text-vrd-text hover:bg-vrd-card-hover transition-colors"
        >
          <Pencil className="w-3 h-3" />
          Rename
        </button>
        <button
          onClick={() => {
            const label = menu.kind === 'project'
              ? projects.find((p) => p.id === menu.id)?.name ?? ''
              : conversations[menu.id]?.title ?? ''
            confirmDelete(menu.kind, menu.id, label)
          }}
          className="flex items-center gap-2 w-full px-3 py-2 text-xs text-danger hover:bg-danger/10 transition-colors"
        >
          <Trash2 className="w-3 h-3" />
          Delete
        </button>
      </div>
    ) : (
      <div className="w-48 bg-vrd-card border border-vrd-border rounded-lg shadow-2xl p-3 space-y-2.5">
        <p className="text-[11px] text-vrd-text leading-snug">
          Delete <span className="font-semibold">"{deleteTarget.label}"</span>?
        </p>
        <div className="flex gap-1.5">
          <button
            onClick={() => setDeleteTarget(null)}
            className="flex-1 px-2 py-1 rounded text-[11px] border border-vrd-border text-vrd-text-muted hover:text-vrd-text transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={executeDelete}
            className="flex-1 px-2 py-1 rounded text-[11px] bg-danger text-white hover:bg-danger/80 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    )
  )

  return (
    <>
      <aside className="w-60 flex-shrink-0 flex flex-col bg-vrd-sidebar border-r border-vrd-border h-full">

        {/* Brand */}
        <Link href="/" className="block px-4 py-4 border-b border-vrd-border">
          <div className="flex items-center gap-2.5">
            <Image src="/Veridian-logo.png" alt="Veridian" width={24} height={24} className="object-contain rounded-lg" />
            <span className="font-semibold text-sm text-vrd-text tracking-tight">Veridian</span>
          </div>
          <p className="text-[10px] text-vrd-text-dim mt-1 ml-5 pl-3.5">ADAS Validation Platform</p>
        </Link>

        {/* Projects header */}
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
          {!hasHydrated && (
            <div className="space-y-1 px-1 pt-1">
              {[70, 50, 62].map((w, i) => (
                <div key={i} className="flex items-center gap-2 px-2 py-2">
                  <div className="w-3.5 h-3.5 rounded-sm bg-vrd-border/50 animate-pulse flex-shrink-0" />
                  <div className="h-2.5 rounded-full bg-vrd-border/50 animate-pulse" style={{ width: `${w}%` }} />
                </div>
              ))}
            </div>
          )}
          {projects.map((project) => {
            const isExpanded = expandedProjects.has(project.id)
            const conversations = getConversationsForProject(project.id)
            const isRenamingProject = renaming?.kind === 'project' && renaming.id === project.id

            return (
              <div key={project.id}>
                {/* Project row */}
                <div className={cn(
                  'group w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-colors',
                  activeProjectId === project.id ? 'text-vrd-text' : 'text-vrd-text-muted hover:text-vrd-text hover:bg-vrd-card-hover',
                )}>
                  <button onClick={() => toggleProject(project.id)} className="flex-shrink-0 text-vrd-text-dim">
                    {isExpanded
                      ? <ChevronDown className="w-3 h-3" />
                      : <ChevronRight className="w-3 h-3" />}
                  </button>
                  <FolderOpen className="w-3.5 h-3.5 flex-shrink-0" />

                  {isRenamingProject ? (
                    <>
                      <input
                        ref={renameInputRef}
                        value={renaming.value}
                        onChange={(e) => setRenaming({ ...renaming, value: e.target.value })}
                        onKeyDown={handleRenameKey}
                        onBlur={commitRename}
                        className="flex-1 bg-vrd-bg border border-primary/40 rounded px-1.5 py-0.5 text-xs text-vrd-text focus:outline-none focus:border-primary/70 min-w-0"
                      />
                      <button onClick={commitRename} className="flex-shrink-0 text-success hover:opacity-75 transition-opacity">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setRenaming(null)} className="flex-shrink-0 text-vrd-text-muted hover:text-vrd-text transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => toggleProject(project.id)} className="flex-1 text-left truncate min-w-0">
                        {project.name}
                      </button>
                      <button
                        onClick={(e) => openMenu(e, 'project', project.id)}
                        className={cn(
                          'flex-shrink-0 p-0.5 rounded transition-colors',
                          menu?.id === project.id
                            ? 'text-vrd-text bg-vrd-card-hover'
                            : 'text-transparent group-hover:text-vrd-text-muted hover:!text-vrd-text hover:bg-vrd-card-hover',
                        )}
                      >
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>

                {/* Conversations */}
                {isExpanded && (
                  <div className="ml-5 mt-0.5 space-y-0.5 border-l border-vrd-border pl-2">
                    {conversations.map((conv) => {
                      const isRenamingConv = renaming?.kind === 'conv' && renaming.id === conv.id
                      const isActive = activeConvId === conv.id

                      return (
                        <div
                          key={conv.id}
                          className={cn(
                            'group flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs transition-colors',
                            isActive
                              ? 'bg-primary/10 text-primary-light border border-primary/20'
                              : 'text-vrd-text-muted hover:text-vrd-text hover:bg-vrd-card-hover',
                          )}
                        >
                          <MessageSquare className="w-3 h-3 flex-shrink-0 opacity-60" />

                          {isRenamingConv ? (
                            <>
                              <input
                                ref={renameInputRef}
                                value={renaming.value}
                                onChange={(e) => setRenaming({ ...renaming, value: e.target.value })}
                                onKeyDown={handleRenameKey}
                                onBlur={commitRename}
                                className="flex-1 bg-vrd-bg border border-primary/40 rounded px-1.5 py-0.5 text-xs text-vrd-text focus:outline-none focus:border-primary/70 min-w-0"
                              />
                              <button onClick={commitRename} className="flex-shrink-0 text-success hover:opacity-75 transition-opacity">
                                <Check className="w-3 h-3" />
                              </button>
                              <button onClick={() => setRenaming(null)} className="flex-shrink-0 text-vrd-text-muted hover:text-vrd-text transition-colors">
                                <X className="w-3 h-3" />
                              </button>
                            </>
                          ) : (
                            <>
                              <Link href={`/project/${project.id}/conversation/${conv.id}`} className="flex-1 truncate min-w-0 flex items-center gap-1.5">
                                <ConvTitle title={conv.title} />
                                {(() => {
                                  const p = getPipeline(conv.id)
                                  const active = p.stage > 0 && p.stage < 4
                                  return active ? (
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse flex-shrink-0" />
                                  ) : null
                                })()}
                              </Link>
                              <button
                                onClick={(e) => openMenu(e, 'conv', conv.id)}
                                className={cn(
                                  'flex-shrink-0 p-0.5 rounded transition-colors',
                                  menu?.id === conv.id
                                    ? 'text-vrd-text bg-vrd-card-hover'
                                    : 'text-transparent group-hover:text-vrd-text-muted hover:!text-vrd-text hover:bg-vrd-card-hover',
                                )}
                              >
                                <MoreHorizontal className="w-3 h-3" />
                              </button>
                            </>
                          )}
                        </div>
                      )
                    })}

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
                : <ChevronDown className="w-3 h-3 text-vrd-text-dim flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />}
            </button>
          </div>

          <div className="space-y-1.5">
            <p className="text-[9px] font-semibold uppercase tracking-wider text-vrd-text-dim px-2">Powered by</p>
            <Image src="/capgemini-logo.png" alt="Capgemini" width={120} height={24} className="object-contain h-auto ml-7" />
          </div>
        </div>
      </aside>

      {/* Portal dropdown — renders on document.body, never clipped by sidebar overflow */}
      {menu && (
        <FloatingMenu
          anchorRect={menu.rect}
          align={menu.kind === 'conv' ? 'left' : 'left'}
          onClose={closeMenu}
        >
          {menuContent}
        </FloatingMenu>
      )}

      <NewProjectModal isOpen={isNewProjectOpen} onClose={() => setIsNewProjectOpen(false)} />
    </>
  )
}

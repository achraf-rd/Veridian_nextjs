import { create } from 'zustand'
import type { Project, Conversation } from '@/types/project'

interface ProjectStore {
  projects: Project[]
  conversations: Record<string, Conversation>
  expandedProjects: Set<string>
  loading: boolean
  hasHydrated: boolean
  error: string | null
  hydrate: () => Promise<void>
  toggleProject: (id: string) => void
  getConversationsForProject: (projectId: string) => Conversation[]
  addProject: (name: string, description?: string) => Promise<void>
  addConversation: (projectId: string, title: string) => Promise<Conversation>
  renameProject: (id: string, name: string) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  renameConversation: (id: string, title: string) => Promise<void>
  deleteConversation: (id: string) => Promise<void>
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  conversations: {},
  expandedProjects: new Set(),
  loading: false,
  hasHydrated: false,
  error: null,

  hydrate: async () => {
    if (get().hasHydrated) return
    set({ loading: true, error: null })
    try {
      const response = await fetch('/api/projects')
      if (!response.ok) throw new Error(`Failed to fetch projects: ${response.status}`)

      const projects = await response.json()
      const conversations: Record<string, Conversation> = {}

      for (const project of projects) {
        const convRes = await fetch(`/api/projects/${project.id}/conversations`)
        if (convRes.ok) {
          const convs = await convRes.json()
          for (const conv of convs) {
            conversations[conv.id] = {
              id: conv.id,
              projectId: conv.projectId,
              title: conv.title,
              createdAt: conv.createdAt,
            }
          }
        }
      }

      set({
        projects: projects.map((p: any) => ({
          id: p.id,
          name: p.name,
          conversationIds: projects
            .find((pr: any) => pr.id === p.id)
            ?.conversations?.map((c: any) => c.id) || [],
        })),
        conversations,
        expandedProjects: new Set(projects.slice(0, 1).map((p: any) => p.id)),
        loading: false,
        hasHydrated: true,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load projects'
      set({ error: message, loading: false, hasHydrated: true })
      console.error(message, err)
    }
  },

  toggleProject: (id) =>
    set((s) => {
      const next = new Set(s.expandedProjects)
      next.has(id) ? next.delete(id) : next.add(id)
      return { expandedProjects: next }
    }),

  getConversationsForProject: (projectId) => {
    const { projects, conversations } = get()
    const project = projects.find((p) => p.id === projectId)
    if (!project) return []
    return project.conversationIds
      .map((id) => conversations[id])
      .filter(Boolean)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  },

  addProject: async (name, description) => {
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      })
      if (!response.ok) throw new Error(`Failed to create project: ${response.status}`)
      const raw = await response.json()
      const newProject = { id: raw.id, name: raw.name, conversationIds: [] }
      set((s) => ({
        projects: [newProject, ...s.projects],
        expandedProjects: new Set([newProject.id, ...s.expandedProjects]),
      }))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create project'
      set({ error: message })
      throw err
    }
  },

  addConversation: async (projectId, title) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })
      if (!response.ok) throw new Error(`Failed to create conversation: ${response.status}`)
      const raw = await response.json()
      const newConversation: Conversation = {
        id: raw.id,
        projectId: raw.projectId,
        title: raw.title,
        createdAt: raw.createdAt,
      }
      set((s) => ({
        conversations: { ...s.conversations, [newConversation.id]: newConversation },
        projects: s.projects.map((p) =>
          p.id === projectId
            ? { ...p, conversationIds: [newConversation.id, ...p.conversationIds] }
            : p
        ),
      }))
      return newConversation
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create conversation'
      set({ error: message })
      throw err
    }
  },

  renameProject: async (id, name) => {
    set((s) => ({
      projects: s.projects.map((p) => (p.id === id ? { ...p, name } : p)),
    }))
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (!res.ok) throw new Error('Failed to rename project')
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to rename project' })
      throw err
    }
  },

  deleteProject: async (id) => {
    set((s) => {
      const project = s.projects.find((p) => p.id === id)
      const removedConvIds = project?.conversationIds ?? []
      const conversations = { ...s.conversations }
      removedConvIds.forEach((cid) => delete conversations[cid])
      const expandedProjects = new Set(s.expandedProjects)
      expandedProjects.delete(id)
      return {
        projects: s.projects.filter((p) => p.id !== id),
        conversations,
        expandedProjects,
      }
    })
    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete project')
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to delete project' })
      throw err
    }
  },

  renameConversation: async (id, title) => {
    set((s) => ({
      conversations: s.conversations[id]
        ? { ...s.conversations, [id]: { ...s.conversations[id], title } }
        : s.conversations,
    }))
    try {
      const res = await fetch(`/api/conversations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })
      if (!res.ok) throw new Error('Failed to rename conversation')
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to rename conversation' })
      throw err
    }
  },

  deleteConversation: async (id) => {
    const conv = get().conversations[id]
    set((s) => {
      const conversations = { ...s.conversations }
      delete conversations[id]
      return {
        conversations,
        projects: s.projects.map((p) =>
          p.id === conv?.projectId
            ? { ...p, conversationIds: p.conversationIds.filter((cid) => cid !== id) }
            : p
        ),
      }
    })
    try {
      const res = await fetch(`/api/conversations/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete conversation')
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to delete conversation' })
      throw err
    }
  },
}))

import { create } from 'zustand'
import type { Project, Conversation } from '@/types/project'

const PROJECTS: Project[] = [
  { id: 'renault-aeb', name: 'Renault AEB Suite v2', conversationIds: ['conv-1', 'conv-2'] },
  { id: 'bmw-lka', name: 'BMW LKA Validation', conversationIds: ['conv-3'] },
]

const CONVERSATIONS: Record<string, Conversation> = {
  'conv-1': { id: 'conv-1', projectId: 'renault-aeb', title: 'lka_requirements_veridian.xlsx — 20 reqs', createdAt: '2026-04-18T09:00:00Z' },
  'conv-2': { id: 'conv-2', projectId: 'renault-aeb', title: 'highway_edge_cases.md — 12 reqs', createdAt: '2026-04-19T14:30:00Z' },
  'conv-3': { id: 'conv-3', projectId: 'bmw-lka', title: 'lka_baseline.xlsx — 31 reqs', createdAt: '2026-04-20T11:00:00Z' },
}

interface ProjectStore {
  projects: Project[]
  conversations: Record<string, Conversation>
  expandedProjects: Set<string>
  toggleProject: (id: string) => void
  getConversationsForProject: (projectId: string) => Conversation[]
  addProject: (project: Project) => void
  addConversation: (projectId: string, conversation: Conversation) => void
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: PROJECTS,
  conversations: CONVERSATIONS,
  expandedProjects: new Set(['renault-aeb']),

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
    return project.conversationIds.map((id) => conversations[id]).filter(Boolean)
  },

  addProject: (project) =>
    set((s) => ({
      projects: [...s.projects, project],
      expandedProjects: new Set([...s.expandedProjects, project.id]),
    })),

  addConversation: (projectId, conversation) =>
    set((s) => ({
      conversations: { ...s.conversations, [conversation.id]: conversation },
      projects: s.projects.map((p) =>
        p.id === projectId
          ? { ...p, conversationIds: [...p.conversationIds, conversation.id] }
          : p
      ),
    })),
}))

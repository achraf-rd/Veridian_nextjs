export interface Project {
  id: string
  name: string
  conversationIds: string[]
}

export interface Conversation {
  id: string
  projectId: string
  title: string
  createdAt: string
}

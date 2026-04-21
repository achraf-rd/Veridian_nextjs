export interface Message {
  id: string
  type: 'engineer' | 'pipeline'
  stage?: 'nlp' | 'scenario' | 'execution' | 'report'
  content?: string
  timestamp: string
}

export interface Round {
  id: number
  startedAt: string
  messages: Message[]
}

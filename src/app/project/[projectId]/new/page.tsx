'use client'

import { useParams, useRouter } from 'next/navigation'
import { useProjectStore } from '@/stores/projectStore'
import { usePipelineStore } from '@/stores/pipelineStore'
import Composer from '@/components/composer'

export default function NewConversationPage() {
  const { projectId } = useParams() as { projectId: string }
  const router = useRouter()
  const { addConversation } = useProjectStore()
  const { submit } = usePipelineStore()

  const handlePendingSubmit = async (requirements: string[], label?: string) => {
    const title = label ?? requirements[0]?.slice(0, 60) ?? 'New conversation'
    try {
      const conv = await addConversation(projectId, title)
      submit(conv.id, requirements, label)
      router.push(`/project/${projectId}/conversation/${conv.id}`)
    } catch {
      // error stored in projectStore
    }
  }

  return (
    <div className="flex h-full items-center justify-center px-4">
      <Composer conversationId="" centered onPendingSubmit={handlePendingSubmit} />
    </div>
  )
}

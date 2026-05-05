'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'
import Composer from '@/components/composer'
import ProjectSelectorModal from '@/components/ProjectSelectorModal'
import { useProjectStore } from '@/stores/projectStore'
import { usePipelineStore } from '@/stores/pipelineStore'

export default function HomeClient() {
  const router = useRouter()
  const { projects, addConversation } = useProjectStore()
  const { submit } = usePipelineStore()

  const [showSelector, setShowSelector] = useState(false)
  const [pending, setPending] = useState<{ requirements: string[]; label?: string } | null>(null)

  // After a new project is created inside ProjectSelectorModal → auto-proceed
  const prevLen = useRef(projects.length)
  useEffect(() => {
    if (pending && projects.length > 0 && prevLen.current === 0) {
      handleSubmitToProject(projects[0].id, pending.requirements, pending.label)
    }
    prevLen.current = projects.length
  }, [projects.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const handlePendingSubmit = (requirements: string[], label?: string) => {
    setPending({ requirements, label })
    setShowSelector(true)
  }

  const handleSubmitToProject = async (projectId: string, requirements: string[], label?: string) => {
    setShowSelector(false)
    setPending(null)
    const title = label ?? requirements[0]?.slice(0, 60) ?? 'New conversation'
    try {
      const conv = await addConversation(projectId, title)
      submit(conv.id, requirements, label)
      router.push(`/project/${projectId}/conversation/${conv.id}`)
    } catch {
      // error in store
    }
  }

  const handleProjectSelect = (projectId: string) => {
    if (pending) {
      handleSubmitToProject(projectId, pending.requirements, pending.label)
    }
  }

  return (
    <div className="flex h-screen bg-vrd-bg overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-hidden flex items-center justify-center px-4">
          <Composer conversationId="" centered onPendingSubmit={handlePendingSubmit} />
        </main>
      </div>

      <ProjectSelectorModal
        isOpen={showSelector}
        onClose={() => { setShowSelector(false); setPending(null) }}
        onSelect={handleProjectSelect}
      />
    </div>
  )
}

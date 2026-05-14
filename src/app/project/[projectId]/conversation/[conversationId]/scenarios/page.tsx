import { Suspense } from 'react'
import ScenarioReviewPage from '@/page-components/ScenarioReview'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <Suspense>
      <ScenarioReviewPage />
    </Suspense>
  )
}

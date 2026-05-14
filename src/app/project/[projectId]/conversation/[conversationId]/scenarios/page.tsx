import { Suspense } from 'react'
import ScenarioReviewPage from '@/pages/ScenarioReview'

export default function Page() {
  return (
    <Suspense>
      <ScenarioReviewPage />
    </Suspense>
  )
}

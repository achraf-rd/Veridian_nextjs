import { Suspense } from 'react'
import RequirementsReviewPage from '@/pages/RequirementsReview'

export default function Page() {
  return (
    <Suspense>
      <RequirementsReviewPage />
    </Suspense>
  )
}

import { Suspense } from 'react'
import RequirementsReviewPage from '@/page-components/RequirementsReview'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <Suspense>
      <RequirementsReviewPage />
    </Suspense>
  )
}

import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import HomeClient from './HomeClient'

export default async function Home() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  return <HomeClient />
}

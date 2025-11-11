import { auth } from '@/lib/auth'
import FeedbackLinksClient from '@/components/admin/FeedbackLinksClient'

export default async function FeedbackLinksPage() {
  const session = await auth()
  const isAdmin = session?.user?.role === 'ADMIN'

  return <FeedbackLinksClient isAdmin={isAdmin} />
}

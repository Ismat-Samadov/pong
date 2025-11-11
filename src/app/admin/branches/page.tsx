import { db } from '@/lib/db'
import BranchesClient from '@/components/admin/BranchesClient'

export default async function BranchesPage() {
  const branches = await db.branch.findMany({
    include: {
      _count: {
        select: { feedbacks: true },
      },
    },
    orderBy: { name: 'asc' },
  })

  // Get all ratings at once grouped by branch
  const ratings = await db.feedback.groupBy({
    by: ['branchId'],
    _avg: {
      rating: true,
    },
  })

  // Create a map for quick lookup
  const ratingsMap = new Map(
    ratings.map((r) => [r.branchId, r._avg.rating || 0])
  )

  // Combine branch data with ratings
  const branchesWithStats = branches.map((branch) => ({
    ...branch,
    feedbackCount: branch._count.feedbacks,
    averageRating: ratingsMap.get(branch.id) || 0,
  }))

  // Calculate stats
  const totalBranches = branchesWithStats.length
  const totalFeedback = branchesWithStats.reduce((sum, b) => sum + b.feedbackCount, 0)
  const avgRating = branchesWithStats.reduce((sum, b) => sum + (b.averageRating || 0), 0) / totalBranches || 0

  // Group by type with counts
  const typeStats = branchesWithStats.reduce((acc, branch) => {
    if (!acc[branch.type]) {
      acc[branch.type] = { count: 0, feedbacks: 0 }
    }
    acc[branch.type].count++
    acc[branch.type].feedbacks += branch.feedbackCount
    return acc
  }, {} as Record<string, { count: number; feedbacks: number }>)

  return (
    <BranchesClient
      branches={branchesWithStats}
      stats={{
        totalBranches,
        totalFeedback,
        avgRating,
        typeStats,
      }}
    />
  )
}

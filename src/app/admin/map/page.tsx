import { db } from '@/lib/db'
import MapClient from '@/components/admin/MapClient'

export default async function MapPage() {
  const branches = await db.branch.findMany({
    include: {
      _count: {
        select: { feedbacks: true },
      },
    },
  })

  // Get all ratings at once grouped by branch (fix N+1 query)
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

  const branchesWithStats = branches.map((branch) => ({
    id: branch.id,
    name: branch.name,
    address: branch.address,
    type: branch.type,
    latitude: branch.latitude,
    longitude: branch.longitude,
    feedbackCount: branch._count.feedbacks,
    averageRating: ratingsMap.get(branch.id) || 0,
  }))

  // Calculate type stats
  const typeStats = branchesWithStats.reduce((acc, branch) => {
    if (!acc[branch.type]) {
      acc[branch.type] = 0
    }
    acc[branch.type]++
    return acc
  }, {} as Record<string, number>)

  return <MapClient branches={branchesWithStats} typeStats={typeStats} />
}

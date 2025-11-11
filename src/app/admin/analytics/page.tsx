import { db } from '@/lib/db'
import { format, subDays } from 'date-fns'
import AnalyticsCharts from '@/components/admin/AnalyticsCharts'

export default async function AnalyticsPage() {
  // Get all feedback with branch info
  const feedbacks = await db.feedback.findMany({
    include: {
      branch: true,
    },
    orderBy: { createdAt: 'asc' },
  })

  // Calculate statistics
  const totalFeedback = feedbacks.length
  const averageRating =
    feedbacks.reduce((acc, f) => acc + f.rating, 0) / totalFeedback || 0

  // Rating distribution
  const ratingDistribution = Array.from({ length: 5 }, (_, i) => ({
    rating: i + 1,
    count: feedbacks.filter((f) => f.rating === i + 1).length,
  }))

  // Feedback by category
  const categoryMap = feedbacks.reduce((acc, f) => {
    acc[f.category] = (acc[f.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const feedbackByCategory = Object.entries(categoryMap)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)

  // Feedback by branch (only feedbacks with branches)
  const branchMap = feedbacks
    .filter(f => f.branchId && f.branch) // Filter out feedbacks without branches
    .reduce((acc, f) => {
      if (!acc[f.branchId!]) {
        acc[f.branchId!] = {
          branchName: f.branch!.name,
          count: 0,
          totalRating: 0,
        }
      }
      acc[f.branchId!].count++
      acc[f.branchId!].totalRating += f.rating
      return acc
    }, {} as Record<string, { branchName: string; count: number; totalRating: number }>)

  const feedbackByBranch = Object.values(branchMap)
    .map((b) => ({
      branchName: b.branchName,
      count: b.count,
      averageRating: b.totalRating / b.count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10) // Top 10

  // Feedback over time (last 30 days)
  const thirtyDaysAgo = subDays(new Date(), 30)
  const recentFeedback = feedbacks.filter(
    (f) => new Date(f.createdAt) >= thirtyDaysAgo
  )

  const dateMap = recentFeedback.reduce((acc, f) => {
    const date = format(new Date(f.createdAt), 'MMM dd')
    acc[date] = (acc[date] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const feedbackOverTime = Object.entries(dateMap).map(([date, count]) => ({
    date,
    count,
  }))

  const analyticsData = {
    totalFeedback,
    averageRating,
    ratingDistribution,
    feedbackByCategory,
    feedbackByBranch,
    feedbackOverTime,
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Analytics</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium">Total Feedback</h3>
          <p className="text-3xl font-bold mt-2">{totalFeedback}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium">Average Rating</h3>
          <p className="text-3xl font-bold mt-2">
            {averageRating.toFixed(1)} ⭐
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium">Last 30 Days</h3>
          <p className="text-3xl font-bold mt-2">{recentFeedback.length}</p>
        </div>
      </div>

      {/* Charts */}
      <AnalyticsCharts data={analyticsData} />
    </div>
  )
}

'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import FeedbackForm from '@/components/feedback/FeedbackForm'

const BranchSelector = dynamic(() => import('@/components/feedback/BranchSelector'), {
  ssr: false,
  loading: () => <div className="h-96 bg-gray-100 rounded-lg animate-pulse"></div>,
})

function FeedbackContent() {
  const searchParams = useSearchParams()
  const branchId = searchParams.get('branch')
  const [branches, setBranches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBranch, setSelectedBranch] = useState<string>(branchId || '')

  useEffect(() => {
    fetch('/api/branches')
      .then((res) => res.json())
      .then((data) => {
        setBranches(data)
        setLoading(false)
        if (branchId && data.some((b: any) => b.id === branchId)) {
          setSelectedBranch(branchId)
        }
      })
      .catch((err) => {
        console.error('Error loading branches:', err)
        setLoading(false)
      })
  }, [branchId])

  const handleBranchSelect = (branchId: string) => {
    setSelectedBranch(branchId)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-4 sm:py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-block bg-white rounded-full px-6 py-2 shadow-md mb-4">
            <p className="text-sm font-semibold text-blue-600">Bank of Baku</p>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold text-gray-900 mb-3 leading-tight">
            Share Your Experience
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            Your feedback matters! Help us serve you better by sharing your thoughts
          </p>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="inline-flex flex-col items-center gap-4">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl">💬</span>
              </div>
              <p className="text-gray-600 font-medium">Loading feedback form...</p>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-5 gap-6 lg:gap-8">
            {/* Map/Branch Selector Section - Sticky on Desktop */}
            <div className="lg:col-span-2 order-1">
              <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 lg:sticky lg:top-6">
                <div className="mb-4">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2 mb-3">
                    <span className="text-2xl">📍</span>
                    Select Your Branch
                  </h2>
                  {selectedBranch && (
                    <div className="mt-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl shadow-sm">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">✓</span>
                        <div>
                          <p className="text-sm font-bold text-green-900 mb-1">
                            Selected Branch
                          </p>
                          <p className="font-semibold text-gray-800">
                            {branches.find(b => b.id === selectedBranch)?.name}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {branches.find(b => b.id === selectedBranch)?.address}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <BranchSelector
                  branches={branches}
                  onBranchSelect={handleBranchSelect}
                  selectedBranchId={selectedBranch}
                />
              </div>
            </div>

            {/* Feedback Form Section */}
            <div className="lg:col-span-3 order-2">
              <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8">
                <div className="mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <span className="text-2xl">✍️</span>
                    Your Feedback
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">Fill in the form below to submit your feedback</p>
                </div>
                <FeedbackForm
                  branches={branches}
                  initialBranchId={selectedBranch}
                />
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <div className="bg-white rounded-2xl shadow-md p-6 max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-3">
              <span className="text-3xl">💙</span>
              <p className="text-lg font-semibold text-gray-800">
                Thank you for your time!
              </p>
            </div>
            <p className="text-sm text-gray-600">
              Your feedback helps us improve our services and serve you better
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function FeedbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <FeedbackContent />
    </Suspense>
  )
}

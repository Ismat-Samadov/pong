'use client'

import { useState } from 'react'
import QRCodeDisplay from './QRCodeDisplay'

interface BranchCardProps {
  branch: {
    id: string
    name: string
    address: string
    type: string
    latitude: number
    longitude: number
    feedbackCount: number
    averageRating: number
  }
}

export default function BranchCard({ branch }: BranchCardProps) {
  const [showQR, setShowQR] = useState(false)

  const feedbackUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/feedback?branch=${branch.id}`

  // Get type color
  const getTypeColor = (type: string) => {
    if (type.toLowerCase().includes('branch')) return 'bg-blue-100 text-blue-700 border-blue-200'
    if (type.toLowerCase().includes('atm')) return 'bg-green-100 text-green-700 border-green-200'
    if (type.toLowerCase().includes('terminal')) return 'bg-purple-100 text-purple-700 border-purple-200'
    return 'bg-gray-100 text-gray-700 border-gray-200'
  }

  // Get rating color
  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600'
    if (rating >= 3.5) return 'text-blue-600'
    if (rating >= 2.5) return 'text-yellow-600'
    return 'text-red-600'
  }

  const rating = branch.averageRating || 0

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 group">
      {/* Header with type badge */}
      <div className="bg-gradient-to-r from-gray-50 to-white p-5 border-b border-gray-100">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition line-clamp-2 flex-1">
            {branch.name}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 ${getTypeColor(branch.type)} text-xs font-medium rounded-full border`}>
            {branch.type}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        {/* Address */}
        <div className="flex items-start gap-2">
          <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-sm text-gray-600 line-clamp-2">{branch.address}</p>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center gap-4">
            {/* Feedback Count */}
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <span className="text-sm font-semibold text-gray-700">{branch.feedbackCount}</span>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className={`text-sm font-semibold ${getRatingColor(rating)}`}>
                {rating > 0 ? rating.toFixed(1) : 'N/A'}
              </span>
            </div>
          </div>

          {/* Coordinates badge */}
          <div className="text-xs text-gray-400 font-mono">
            {branch.latitude.toFixed(2)}, {branch.longitude.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-5 pt-0 flex gap-2">
        <button
          onClick={() => setShowQR(!showQR)}
          className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
            showQR
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            {showQR ? 'Hide QR' : 'QR Code'}
          </div>
        </button>
        <a
          href={`https://www.google.com/maps?q=${branch.latitude},${branch.longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-medium text-sm shadow-sm hover:shadow"
        >
          <div className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            View Map
          </div>
        </a>
      </div>

      {/* QR Code Section */}
      {showQR && (
        <div className="px-5 pb-5">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <QRCodeDisplay url={feedbackUrl} branchName={branch.name} />
          </div>
        </div>
      )}
    </div>
  )
}

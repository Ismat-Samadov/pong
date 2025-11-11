'use client'

import { useState } from 'react'

interface SyncStats {
  total: number
  created: number
  updated: number
  errors: number
}

interface SyncResponse {
  success: boolean
  message: string
  stats: SyncStats
}

interface PreviewBranch {
  id: string
  name: string
  address: string
  type: string
  services: string
  latitude: number
  longitude: number
}

export default function BranchesSyncPage() {
  const [syncing, setSyncing] = useState(false)
  const [result, setResult] = useState<SyncResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<PreviewBranch[]>([])
  const [loadingPreview, setLoadingPreview] = useState(false)

  const handlePreview = async () => {
    setLoadingPreview(true)
    setError(null)
    try {
      const res = await fetch('/api/branches/sync')
      const data = await res.json()

      if (data.success) {
        setPreview(data.branches)
      } else {
        setError(data.error || 'Failed to load preview')
      }
    } catch (err) {
      setError('Failed to load preview')
      console.error('Preview error:', err)
    } finally {
      setLoadingPreview(false)
    }
  }

  const handleSync = async () => {
    if (!confirm('This will sync all branches from Bank of Baku API. Continue?')) {
      return
    }

    setSyncing(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/branches/sync', {
        method: 'POST',
      })

      const data = await res.json()

      if (data.success) {
        setResult(data)
        setPreview([]) // Clear preview after sync
      } else {
        setError(data.error || 'Sync failed')
      }
    } catch (err) {
      setError('Failed to sync branches')
      console.error('Sync error:', err)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Branch Sync</h1>
        <p className="text-gray-600 mt-1">
          Sync branches from Bank of Baku API to your database
        </p>
      </div>

      {/* Action Buttons */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Actions</h2>
        <div className="flex gap-4">
          <button
            onClick={handlePreview}
            disabled={loadingPreview || syncing}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingPreview ? 'Loading...' : 'Preview API Data'}
          </button>
          <button
            onClick={handleSync}
            disabled={syncing || loadingPreview}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {syncing ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Preview will show data without saving. Sync will update your database.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800 font-medium">Error</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Success Result */}
      {result && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <p className="text-green-800 font-semibold text-lg mb-2">
            {result.message}
          </p>
          <div className="grid grid-cols-4 gap-4 mt-4">
            <div className="bg-white rounded-lg p-4">
              <p className="text-gray-600 text-sm">Total</p>
              <p className="text-2xl font-bold text-gray-900">{result.stats.total}</p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <p className="text-gray-600 text-sm">Created</p>
              <p className="text-2xl font-bold text-green-600">{result.stats.created}</p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <p className="text-gray-600 text-sm">Updated</p>
              <p className="text-2xl font-bold text-blue-600">{result.stats.updated}</p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <p className="text-gray-600 text-sm">Errors</p>
              <p className="text-2xl font-bold text-red-600">{result.stats.errors}</p>
            </div>
          </div>
        </div>
      )}

      {/* Preview Data */}
      {preview.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">
              Preview: {preview.length} Branches
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Data from Bank of Baku API (not yet saved to database)
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Address
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Coordinates
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {preview.map((branch) => (
                  <tr key={branch.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{branch.name}</div>
                      <div className="text-sm text-gray-500 mt-1">{branch.services}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{branch.address}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          branch.type === 'ATM'
                            ? 'bg-blue-100 text-blue-700'
                            : branch.type === 'Branch'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}
                      >
                        {branch.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {branch.latitude.toFixed(6)}, {branch.longitude.toFixed(6)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

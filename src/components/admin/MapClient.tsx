'use client'

import { useState, useMemo } from 'react'
import BranchMap from './BranchMap'

interface Branch {
  id: string
  name: string
  address: string
  type: string
  latitude: number
  longitude: number
  feedbackCount: number
  averageRating: number
}

interface MapClientProps {
  branches: Branch[]
  typeStats: Record<string, number>
}

export default function MapClient({ branches, typeStats }: MapClientProps) {
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set(Object.keys(typeStats)))
  const [searchTerm, setSearchTerm] = useState('')

  const types = Object.keys(typeStats)

  // Filter branches
  const filteredBranches = useMemo(() => {
    return branches.filter((branch) => {
      const matchesType = selectedTypes.has(branch.type)
      const matchesSearch =
        searchTerm === '' ||
        branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        branch.address.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesType && matchesSearch
    })
  }, [branches, selectedTypes, searchTerm])

  const toggleType = (type: string) => {
    const newSelected = new Set(selectedTypes)
    if (newSelected.has(type)) {
      newSelected.delete(type)
    } else {
      newSelected.add(type)
    }
    setSelectedTypes(newSelected)
  }

  const selectAll = () => {
    setSelectedTypes(new Set(types))
  }

  const deselectAll = () => {
    setSelectedTypes(new Set())
  }

  // Get type color
  const getTypeColor = (type: string) => {
    if (type.toLowerCase().includes('atm')) return { bg: 'bg-blue-600', border: 'border-blue-600', text: 'text-blue-600' }
    if (type.toLowerCase().includes('branch')) return { bg: 'bg-green-600', border: 'border-green-600', text: 'text-green-600' }
    return { bg: 'bg-orange-600', border: 'border-orange-600', text: 'text-orange-600' }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-8 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">Branch Map</h1>
            <p className="text-blue-100">Interactive map of all locations</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg px-6 py-4">
            <div className="text-sm text-blue-100 mb-1">Showing Locations</div>
            <div className="text-3xl font-bold">{filteredBranches.length}</div>
            <div className="text-xs text-blue-200 mt-1">of {branches.length} total</div>
          </div>
        </div>

        {/* Stats by type */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {types.map((type) => {
            const colors = getTypeColor(type)
            const count = filteredBranches.filter(b => b.type === type).length
            const total = typeStats[type]

            return (
              <div key={type} className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-blue-100 text-sm">{type}</span>
                  <div className={`w-4 h-4 rounded-full ${colors.bg}`}></div>
                </div>
                <p className="text-2xl font-bold">
                  {count}
                  {count !== total && <span className="text-lg text-blue-200"> / {total}</span>}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 pl-11 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg
                className="absolute left-3 top-3.5 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex gap-2">
            <button
              onClick={selectAll}
              className="px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              Select All
            </button>
            <button
              onClick={deselectAll}
              className="px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Type filters */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Filter by Type:</label>
          <div className="flex flex-wrap gap-3">
            {types.map((type) => {
              const colors = getTypeColor(type)
              const isSelected = selectedTypes.has(type)

              return (
                <button
                  key={type}
                  onClick={() => toggleType(type)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                    isSelected
                      ? `${colors.border} ${colors.bg} text-white`
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full ${isSelected ? 'bg-white' : colors.bg}`}></div>
                  <span className="font-medium">{type}</span>
                  <span className={`text-sm ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                    ({typeStats[type]})
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Results info */}
        {filteredBranches.length === 0 && (
          <div className="text-center py-8">
            <svg className="mx-auto w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-500 text-lg mb-4">No locations found matching your filters</p>
            <button
              onClick={() => {
                selectAll()
                setSearchTerm('')
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Map */}
      {filteredBranches.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <BranchMap branches={filteredBranches} />
        </div>
      )}

      {/* Legend */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Map Legend</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {types.map((type) => {
            const colors = getTypeColor(type)

            return (
              <div key={type} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full ${colors.bg} border-3 border-white shadow-lg flex-shrink-0`}></div>
                <div>
                  <div className="font-semibold text-gray-900">{type}</div>
                  <div className="text-sm text-gray-500">{typeStats[type]} locations</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

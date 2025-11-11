'use client'

import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

interface Branch {
  id: string
  name: string
  address: string
  latitude: number
  longitude: number
  type: string
}

interface BranchSelectorProps {
  branches: Branch[]
  onBranchSelect: (branchId: string) => void
  selectedBranchId?: string
}

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView([lat, lng], 13)
  }, [lat, lng, map])
  return null
}

export default function BranchSelector({ branches, onBranchSelect, selectedBranchId }: BranchSelectorProps) {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [nearestBranch, setNearestBranch] = useState<Branch | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedView, setSelectedView] = useState<'map' | 'list'>('map')
  const [locationRequested, setLocationRequested] = useState(false)
  const [locationLoading, setLocationLoading] = useState(false)

  // Filter to show ONLY "Branches" type (not ATMs or Payment terminals)
  const branchesOnly = branches.filter(b => b.type === 'Branches')

  // Default center (Baku, Azerbaijan)
  const defaultCenter = { lat: 40.4093, lng: 49.8671 }

  const requestLocation = () => {
    setLocationLoading(true)
    setLocationRequested(true)

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLoc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }
          setUserLocation(userLoc)
          setLocationLoading(false)

          // Find nearest branch (only from actual branches, not ATMs)
          if (branchesOnly.length > 0) {
            const nearest = branchesOnly.reduce((prev, curr) => {
              const prevDist = getDistance(userLoc, { lat: prev.latitude, lng: prev.longitude })
              const currDist = getDistance(userLoc, { lat: curr.latitude, lng: curr.longitude })
              return currDist < prevDist ? curr : prev
            })
            setNearestBranch(nearest)
          }
        },
        (error) => {
          console.log('Location access denied:', error)
          setLocationLoading(false)
          alert('Unable to access your location. Please enable location permissions or select a branch manually.')
        }
      )
    } else {
      setLocationLoading(false)
      alert('Geolocation is not supported by your browser.')
    }
  }

  const getDistance = (loc1: { lat: number; lng: number }, loc2: { lat: number; lng: number }) => {
    const R = 6371 // Earth's radius in km
    const dLat = ((loc2.lat - loc1.lat) * Math.PI) / 180
    const dLng = ((loc2.lng - loc1.lng) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((loc1.lat * Math.PI) / 180) *
        Math.cos((loc2.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  const filteredBranches = branchesOnly.filter(
    (branch) =>
      branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.address.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const mapCenter = userLocation || defaultCenter

  return (
    <div className="space-y-4">
      {/* Find Nearest Branch Button */}
      {!locationRequested && (
        <button
          onClick={requestLocation}
          disabled={locationLoading}
          className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all font-semibold shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {locationLoading ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              Finding your location...
            </>
          ) : (
            <>
              <span className="text-xl">📍</span>
              Find Nearest Branch
            </>
          )}
        </button>
      )}

      {/* View Toggle */}
      <div className="flex gap-3 bg-gray-100 p-1 rounded-xl">
        <button
          onClick={() => setSelectedView('map')}
          className={`flex-1 px-4 py-3 rounded-lg transition-all font-medium text-sm sm:text-base ${
            selectedView === 'map'
              ? 'bg-white text-blue-600 shadow-md'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <span className="mr-2">🗺️</span>
          Map
        </button>
        <button
          onClick={() => setSelectedView('list')}
          className={`flex-1 px-4 py-3 rounded-lg transition-all font-medium text-sm sm:text-base ${
            selectedView === 'list'
              ? 'bg-white text-blue-600 shadow-md'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <span className="mr-2">📋</span>
          List
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">🔍</span>
        <input
          type="text"
          placeholder="Search branches..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 sm:py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-base"
        />
      </div>

      {/* Nearest Branch Suggestion */}
      {nearestBranch && !selectedBranchId && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 shadow-md">
          <div className="flex items-start gap-3 mb-3">
            <span className="text-2xl">📍</span>
            <div className="flex-1">
              <p className="text-sm font-bold text-blue-900 mb-1">
                Nearest Branch
              </p>
              <p className="text-base font-semibold text-gray-800">{nearestBranch.name}</p>
              <p className="text-sm text-gray-600 mt-1">{nearestBranch.address}</p>
            </div>
          </div>
          <button
            onClick={() => onBranchSelect(nearestBranch.id)}
            className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold shadow-md transform hover:scale-[1.02] active:scale-95"
          >
            ✓ Select This Branch
          </button>
        </div>
      )}

      {/* Map or List View */}
      {selectedView === 'map' ? (
        <div className="h-[400px] sm:h-[500px] rounded-xl overflow-hidden border-2 border-gray-200 shadow-lg">
          <MapContainer
            center={[mapCenter.lat, mapCenter.lng]}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {userLocation && <RecenterMap lat={userLocation.lat} lng={userLocation.lng} />}

            {/* User location marker */}
            {userLocation && (
              <Marker position={[userLocation.lat, userLocation.lng]}>
                <Popup>
                  <div className="text-center p-1">
                    <span className="text-2xl">📍</span>
                    <p className="font-semibold">Your Location</p>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Branch markers */}
            {filteredBranches.map((branch) => (
              <Marker
                key={branch.id}
                position={[branch.latitude, branch.longitude]}
              >
                <Popup>
                  <div className="p-2 min-w-[200px]">
                    <h3 className="font-bold text-gray-900 mb-2">{branch.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{branch.address}</p>
                    <p className="text-xs text-gray-500 mb-3 bg-gray-100 px-2 py-1 rounded inline-block">
                      {branch.type}
                    </p>
                    <button
                      onClick={() => onBranchSelect(branch.id)}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold shadow-md"
                    >
                      ✓ Select Branch
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      ) : (
        <div className="max-h-[400px] sm:max-h-[500px] overflow-y-auto space-y-3 pr-1">
          {filteredBranches.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <span className="text-5xl mb-3 block">🔍</span>
              <p className="text-gray-600 font-medium">No branches found</p>
              <p className="text-sm text-gray-500 mt-1">Try a different search term</p>
            </div>
          ) : (
            filteredBranches.map((branch) => (
              <div
                key={branch.id}
                className="p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer bg-white transform hover:scale-[1.01] active:scale-[0.99]"
                onClick={() => onBranchSelect(branch.id)}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🏦</span>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-1">{branch.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{branch.address}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg font-medium">
                        {branch.type}
                      </span>
                      {userLocation && (
                        <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-lg font-medium flex items-center gap-1">
                          <span>📍</span>
                          {getDistance(userLocation, { lat: branch.latitude, lng: branch.longitude }).toFixed(2)} km
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-blue-500 text-xl">→</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

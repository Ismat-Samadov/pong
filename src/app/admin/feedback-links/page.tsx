'use client'

import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'

interface Branch {
  id: string
  name: string
  address: string
}

interface FeedbackLink {
  id: string
  name: string
  slug: string
  branchId?: string
  branch?: Branch
  description?: string
  active: boolean
  expiresAt?: string
  usageCount: number
  maxUsage?: number
  createdAt: string
}

export default function FeedbackLinksPage() {
  const [links, setLinks] = useState<FeedbackLink[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingLink, setEditingLink] = useState<FeedbackLink | null>(null)
  const [showQR, setShowQR] = useState<FeedbackLink | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    branchId: '',
    description: '',
    expiresAt: '',
    maxUsage: '',
  })

  useEffect(() => {
    fetchLinks()
    fetchBranches()
  }, [])

  const fetchLinks = async () => {
    try {
      const res = await fetch('/api/feedback-links')
      const data = await res.json()

      // Check if response is OK and data is an array
      if (res.ok && Array.isArray(data)) {
        setLinks(data)
      } else {
        console.error('Invalid response:', data)
        setLinks([])
      }
    } catch (error) {
      console.error('Error fetching links:', error)
      setLinks([])
    } finally {
      setLoading(false)
    }
  }

  const fetchBranches = async () => {
    try {
      const res = await fetch('/api/branches')
      const data = await res.json()

      // Check if response is OK and data is an array
      if (res.ok && Array.isArray(data)) {
        setBranches(data)
      } else {
        console.error('Invalid response:', data)
        setBranches([])
      }
    } catch (error) {
      console.error('Error fetching branches:', error)
      setBranches([])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const payload = {
      name: formData.name,
      branchId: formData.branchId || null,
      description: formData.description || null,
      expiresAt: formData.expiresAt || null,
      maxUsage: formData.maxUsage ? parseInt(formData.maxUsage) : null,
    }

    try {
      let response
      if (editingLink) {
        response = await fetch(`/api/feedback-links/${editingLink.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, active: editingLink.active }),
        })
      } else {
        response = await fetch('/api/feedback-links', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save link')
      }

      setFormData({ name: '', branchId: '', description: '', expiresAt: '', maxUsage: '' })
      setShowForm(false)
      setEditingLink(null)
      fetchLinks()
      alert(editingLink ? 'Link updated successfully!' : 'Link created successfully!')
    } catch (error) {
      console.error('Error saving link:', error)
      alert(error instanceof Error ? error.message : 'Failed to save link. Please try again.')
    }
  }

  const handleEdit = (link: FeedbackLink) => {
    setEditingLink(link)
    setFormData({
      name: link.name,
      branchId: link.branchId || '',
      description: link.description || '',
      expiresAt: link.expiresAt ? link.expiresAt.split('T')[0] : '',
      maxUsage: link.maxUsage?.toString() || '',
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this link?')) return

    try {
      const response = await fetch(`/api/feedback-links/${id}`, { method: 'DELETE' })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete link')
      }

      alert('Link deleted successfully!')
      fetchLinks()
    } catch (error) {
      console.error('Error deleting link:', error)
      alert(error instanceof Error ? error.message : 'Failed to delete link. Please try again.')
    }
  }

  const toggleActive = async (link: FeedbackLink) => {
    try {
      const response = await fetch(`/api/feedback-links/${link.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...link, active: !link.active }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to toggle link status')
      }

      fetchLinks()
    } catch (error) {
      console.error('Error toggling link:', error)
      alert(error instanceof Error ? error.message : 'Failed to toggle link status. Please try again.')
    }
  }

  const getFeedbackUrl = (slug: string) => {
    return `${window.location.origin}/feedback?link=${slug}`
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Link copied to clipboard!')
  }

  const downloadQR = (slug: string, name: string) => {
    const svg = document.getElementById(`qr-${slug}`)
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx?.drawImage(img, 0, 0)
      const pngFile = canvas.toDataURL('image/png')

      const downloadLink = document.createElement('a')
      downloadLink.download = `qr-${name.replace(/\s+/g, '-')}.png`
      downloadLink.href = pngFile
      downloadLink.click()
    }

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Feedback Links</h1>
          <p className="text-gray-600 mt-1">Create and manage shareable feedback collection links</p>
        </div>
        <button
          onClick={() => {
            setShowForm(true)
            setEditingLink(null)
            setFormData({ name: '', branchId: '', description: '', expiresAt: '', maxUsage: '' })
          }}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
        >
          + Create Link
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingLink ? 'Edit Link' : 'Create New Link'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Link Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Main Branch Feedback"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Branch (Optional)</label>
                <select
                  value={formData.branchId}
                  onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Branches</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Optional description for internal use"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Expires At (Optional)</label>
                  <input
                    type="date"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Max Usage (Optional)</label>
                  <input
                    type="number"
                    value={formData.maxUsage}
                    onChange={(e) => setFormData({ ...formData, maxUsage: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Unlimited"
                    min="1"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  {editingLink ? 'Update Link' : 'Create Link'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingLink(null)
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQR && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">{showQR.name}</h2>
            <div className="flex justify-center mb-6">
              <QRCodeSVG
                id={`qr-${showQR.slug}`}
                value={getFeedbackUrl(showQR.slug)}
                size={256}
                level="H"
                includeMargin
              />
            </div>
            <div className="space-y-3">
              <button
                onClick={() => downloadQR(showQR.slug, showQR.name)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Download QR Code
              </button>
              <button
                onClick={() => copyToClipboard(getFeedbackUrl(showQR.slug))}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Copy Link
              </button>
              <button
                onClick={() => setShowQR(null)}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Links Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Branch</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Usage</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Created</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {links.map((link) => (
                <tr key={link.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900">{link.name}</div>
                      {link.description && (
                        <div className="text-sm text-gray-500">{link.description}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {link.branch?.name || 'All Branches'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {link.usageCount} {link.maxUsage ? `/ ${link.maxUsage}` : ''}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleActive(link)}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        link.active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {link.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(link.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setShowQR(link)}
                        className="px-3 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 text-sm font-medium"
                        title="Show QR Code"
                      >
                        QR
                      </button>
                      <button
                        onClick={() => copyToClipboard(getFeedbackUrl(link.slug))}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm font-medium"
                        title="Copy Link"
                      >
                        Copy
                      </button>
                      <button
                        onClick={() => handleEdit(link)}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(link.id)}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {links.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No feedback links created yet. Create your first one!</p>
        </div>
      )}
    </div>
  )
}

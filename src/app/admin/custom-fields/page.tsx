'use client'

import { useState, useEffect } from 'react'

const FIELD_TYPES = [
  { value: 'TEXT', label: 'Text' },
  { value: 'TEXTAREA', label: 'Textarea' },
  { value: 'NUMBER', label: 'Number' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'PHONE', label: 'Phone' },
  { value: 'SELECT', label: 'Select Dropdown' },
  { value: 'CHECKBOX', label: 'Checkbox' },
  { value: 'RADIO', label: 'Radio Buttons' },
  { value: 'DATE', label: 'Date' },
]

interface CustomField {
  id: string
  name: string
  label: string
  type: string
  required: boolean
  options?: string
  placeholder?: string
  order: number
  active: boolean
}

export default function CustomFieldsPage() {
  const [fields, setFields] = useState<CustomField[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingField, setEditingField] = useState<CustomField | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    label: '',
    type: 'TEXT',
    required: false,
    options: '',
    placeholder: '',
    order: 0,
  })

  useEffect(() => {
    fetchFields()
  }, [])

  const fetchFields = async () => {
    try {
      const res = await fetch('/api/custom-fields')
      const data = await res.json()

      // Check if response is OK and data is an array
      if (res.ok && Array.isArray(data)) {
        setFields(data)
      } else {
        console.error('Invalid response:', data)
        setFields([])
      }
    } catch (error) {
      console.error('Error fetching fields:', error)
      setFields([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const payload = {
      ...formData,
      options: formData.options ? formData.options.split(',').map((o) => o.trim()) : null,
    }

    try {
      if (editingField) {
        await fetch(`/api/custom-fields/${editingField.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, active: editingField.active }),
        })
      } else {
        await fetch('/api/custom-fields', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      setFormData({
        name: '',
        label: '',
        type: 'TEXT',
        required: false,
        options: '',
        placeholder: '',
        order: 0,
      })
      setShowForm(false)
      setEditingField(null)
      fetchFields()
    } catch (error) {
      console.error('Error saving field:', error)
      alert('Failed to save field')
    }
  }

  const handleEdit = (field: CustomField) => {
    setEditingField(field)
    setFormData({
      name: field.name,
      label: field.label,
      type: field.type,
      required: field.required,
      options: field.options ? JSON.parse(field.options).join(', ') : '',
      placeholder: field.placeholder || '',
      order: field.order,
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this field?')) return

    try {
      await fetch(`/api/custom-fields/${id}`, { method: 'DELETE' })
      fetchFields()
    } catch (error) {
      console.error('Error deleting field:', error)
      alert('Failed to delete field')
    }
  }

  const toggleActive = async (field: CustomField) => {
    try {
      await fetch(`/api/custom-fields/${field.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...field, active: !field.active }),
      })
      fetchFields()
    } catch (error) {
      console.error('Error toggling field:', error)
    }
  }

  const requiresOptions = ['SELECT', 'CHECKBOX', 'RADIO'].includes(formData.type)

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
          <h1 className="text-3xl font-bold text-gray-900">Custom Fields</h1>
          <p className="text-gray-600 mt-1">Manage dynamic feedback form fields</p>
        </div>
        <button
          onClick={() => {
            setShowForm(true)
            setEditingField(null)
            setFormData({
              name: '',
              label: '',
              type: 'TEXT',
              required: false,
              options: '',
              placeholder: '',
              order: 0,
            })
          }}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
        >
          + Add Field
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingField ? 'Edit Field' : 'Add New Field'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Field Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., customerAge"
                  />
                  <p className="text-xs text-gray-500 mt-1">Used internally (no spaces)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Field Label *</label>
                  <input
                    type="text"
                    required
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Customer Age"
                  />
                  <p className="text-xs text-gray-500 mt-1">Shown to users</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Field Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {FIELD_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Order</label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Placeholder</label>
                <input
                  type="text"
                  value={formData.placeholder}
                  onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional placeholder text"
                />
              </div>

              {requiresOptions && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Options * <span className="text-gray-500 font-normal">(comma-separated)</span>
                  </label>
                  <input
                    type="text"
                    required={requiresOptions}
                    value={formData.options}
                    onChange={(e) => setFormData({ ...formData, options: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Option 1, Option 2, Option 3"
                  />
                </div>
              )}

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="required"
                  checked={formData.required}
                  onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="required" className="ml-2 text-sm font-medium text-gray-700">
                  Required field
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  {editingField ? 'Update Field' : 'Add Field'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingField(null)
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

      {/* Fields Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Order</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Label</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Type</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Required</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {fields.map((field) => (
                <tr key={field.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-600">{field.order}</td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900">{field.label}</div>
                      <div className="text-sm text-gray-500">({field.name})</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                      {field.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {field.required ? (
                      <span className="text-red-600 font-medium">Yes</span>
                    ) : (
                      <span className="text-gray-400">No</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleActive(field)}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        field.active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {field.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(field)}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(field.id)}
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

      {fields.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No custom fields created yet. Add your first one!</p>
        </div>
      )}
    </div>
  )
}

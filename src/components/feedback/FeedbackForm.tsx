'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { feedbackSchema, type FeedbackFormData } from '@/types'

interface FeedbackFormProps {
  branches: Array<{
    id: string
    name: string
    type: string
    address: string
  }>
  initialBranchId: string
}

const categories = [
  'Service Quality',
  'Cleanliness',
  'Speed of Service',
  'Staff Behavior',
  'Facilities',
  'Other',
]

export default function FeedbackForm({ branches, initialBranchId }: FeedbackFormProps) {
  const [files, setFiles] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  // Filter to show only "Branches" type
  const branchesOnly = branches.filter(b => b.type === 'Branches')

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      branchId: initialBranchId,
      rating: 0,
    },
  })

  // Update form when initialBranchId changes (from map selection)
  useEffect(() => {
    if (initialBranchId) {
      setValue('branchId', initialBranchId)
    }
  }, [initialBranchId, setValue])

  const selectedRating = watch('rating')

  const onSubmit = async (data: FeedbackFormData) => {
    setSubmitting(true)
    try {
      const formData = new FormData()
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString())
        }
      })

      files.forEach((file) => {
        formData.append('files', file)
      })

      const response = await fetch('/api/feedback', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        setSuccess(true)
        reset()
        setFiles([])
        setTimeout(() => setSuccess(false), 5000)
      } else {
        alert('Failed to submit feedback. Please try again.')
      }
    } catch (error) {
      console.error('Error submitting feedback:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setFiles((prev) => [...prev, ...newFiles].slice(0, 5)) // Max 5 files
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          Thank you for your feedback!
        </div>
      )}

      {/* Branch Selection */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Select Branch <span className="text-red-500">*</span>
        </label>
        <select
          {...register('branchId')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Choose a branch...</option>
          {branchesOnly.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name}
            </option>
          ))}
        </select>
        {errors.branchId && (
          <p className="text-red-500 text-sm mt-1">{errors.branchId.message}</p>
        )}
      </div>

      {/* Rating */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Rating <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((rating) => (
            <label key={rating} className="cursor-pointer">
              <input
                type="radio"
                {...register('rating', { valueAsNumber: true })}
                value={rating}
                className="sr-only"
              />
              <span
                className={`text-4xl ${
                  selectedRating >= rating ? 'text-yellow-500' : 'text-gray-300'
                }`}
              >
                ★
              </span>
            </label>
          ))}
        </div>
        {errors.rating && (
          <p className="text-red-500 text-sm mt-1">{errors.rating.message}</p>
        )}
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Category <span className="text-red-500">*</span>
        </label>
        <select
          {...register('category')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select a category...</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        {errors.category && (
          <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>
        )}
      </div>

      {/* Comment */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Comments (Optional)
        </label>
        <textarea
          {...register('comment')}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Tell us more about your experience..."
        />
      </div>

      {/* Contact Information */}
      <div className="border-t pt-4">
        <h3 className="font-medium mb-4">Contact Information (Optional)</h3>
        <div className="space-y-3">
          <input
            type="text"
            {...register('customerName')}
            placeholder="Your Name"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            type="email"
            {...register('customerEmail')}
            placeholder="Your Email"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {errors.customerEmail && (
            <p className="text-red-500 text-sm">{errors.customerEmail.message}</p>
          )}
          <input
            type="tel"
            {...register('customerPhone')}
            placeholder="Your Phone"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* File Upload */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Attachments (Optional, max 5 files)
        </label>
        <input
          type="file"
          multiple
          accept="image/*,.pdf"
          onChange={handleFileChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
        {files.length > 0 && (
          <div className="mt-2 space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-gray-50 p-2 rounded"
              >
                <span className="text-sm truncate">{file.name}</span>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="text-red-500 hover:text-red-700 ml-2"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition disabled:bg-blue-300 font-medium text-lg"
      >
        {submitting ? 'Submitting...' : 'Submit Feedback'}
      </button>
    </form>
  )
}

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
  { value: 'Service Quality', icon: '👥', color: 'blue' },
  { value: 'Cleanliness', icon: '✨', color: 'green' },
  { value: 'Speed of Service', icon: '⚡', color: 'yellow' },
  { value: 'Staff Behavior', icon: '😊', color: 'purple' },
  { value: 'Facilities', icon: '🏢', color: 'indigo' },
  { value: 'Other', icon: '💬', color: 'gray' },
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
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-4 rounded-xl shadow-lg animate-pulse">
          <div className="flex items-center gap-3">
            <span className="text-3xl">✓</span>
            <div>
              <p className="font-bold text-lg">Thank you!</p>
              <p className="text-sm text-green-50">Your feedback has been submitted successfully</p>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Branch ID - set by map selection */}
      <input type="hidden" {...register('branchId')} />
      {errors.branchId && (
        <div className="bg-red-50 border-2 border-red-300 text-red-700 px-6 py-4 rounded-xl">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-semibold">Branch Required</p>
              <p className="text-sm mt-1">Please select a branch from the map or list on the left</p>
            </div>
          </div>
        </div>
      )}

      {/* Rating */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border-2 border-blue-100">
        <label className="block text-base font-semibold mb-3 text-gray-800">
          How was your experience? <span className="text-red-500">*</span>
        </label>
        <div className="flex justify-center gap-2 sm:gap-4">
          {[1, 2, 3, 4, 5].map((rating) => (
            <label key={rating} className="cursor-pointer transition-transform hover:scale-110 active:scale-95">
              <input
                type="radio"
                {...register('rating', { valueAsNumber: true })}
                value={rating}
                className="sr-only"
              />
              <div className="flex flex-col items-center gap-2">
                <span
                  className={`text-5xl sm:text-6xl transition-all ${
                    selectedRating >= rating
                      ? 'text-yellow-400 drop-shadow-lg scale-110'
                      : 'text-gray-300 hover:text-gray-400'
                  }`}
                >
                  ★
                </span>
                {selectedRating === rating && (
                  <span className="text-xs font-medium text-blue-600">
                    {rating === 1 ? 'Poor' : rating === 2 ? 'Fair' : rating === 3 ? 'Good' : rating === 4 ? 'Very Good' : 'Excellent'}
                  </span>
                )}
              </div>
            </label>
          ))}
        </div>
        {errors.rating && (
          <p className="text-red-600 text-sm mt-3 font-medium text-center">⚠️ {errors.rating.message}</p>
        )}
      </div>

      {/* Category */}
      <div>
        <label className="block text-base font-semibold mb-3 text-gray-800">
          What would you like to tell us about? <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {categories.map((category) => (
            <label
              key={category.value}
              className={`relative cursor-pointer group`}
            >
              <input
                type="radio"
                {...register('category')}
                value={category.value}
                className="sr-only peer"
              />
              <div className={`
                flex flex-col items-center justify-center p-4 rounded-xl border-2
                transition-all duration-200
                peer-checked:border-${category.color}-500 peer-checked:bg-${category.color}-50
                peer-checked:shadow-lg peer-checked:scale-105
                border-gray-200 bg-white hover:border-${category.color}-300 hover:shadow-md
              `}>
                <span className="text-3xl mb-2">{category.icon}</span>
                <span className="text-xs sm:text-sm font-medium text-gray-700 text-center leading-tight">
                  {category.value}
                </span>
              </div>
            </label>
          ))}
        </div>
        {errors.category && (
          <p className="text-red-600 text-sm mt-2 font-medium">⚠️ {errors.category.message}</p>
        )}
      </div>

      {/* Comment */}
      <div>
        <label className="block text-base font-semibold mb-3 text-gray-800">
          Tell us more <span className="text-gray-400 text-sm font-normal">(Optional)</span>
        </label>
        <textarea
          {...register('comment')}
          rows={5}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none text-base"
          placeholder="Share your experience with us... We'd love to hear the details!"
        />
        <p className="text-xs text-gray-500 mt-2">Your feedback helps us improve our services</p>
      </div>

      {/* Contact Information */}
      <div className="border-t-2 border-gray-100 pt-6">
        <h3 className="text-base font-semibold mb-4 text-gray-800 flex items-center gap-2">
          <span>📧</span> Contact Information
          <span className="text-gray-400 text-sm font-normal">(Optional)</span>
        </h3>
        <div className="space-y-4">
          <div>
            <input
              type="text"
              {...register('customerName')}
              placeholder="Your Name"
              className="w-full px-4 py-3 sm:py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-base"
            />
          </div>
          <div>
            <input
              type="email"
              {...register('customerEmail')}
              placeholder="Your Email"
              className="w-full px-4 py-3 sm:py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-base"
            />
            {errors.customerEmail && (
              <p className="text-red-600 text-sm mt-2 font-medium">⚠️ {errors.customerEmail.message}</p>
            )}
          </div>
          <div>
            <input
              type="tel"
              {...register('customerPhone')}
              placeholder="Your Phone Number"
              className="w-full px-4 py-3 sm:py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-base"
            />
          </div>
        </div>
      </div>

      {/* File Upload */}
      <div>
        <label className="block text-base font-semibold mb-3 text-gray-800 flex items-center gap-2">
          <span>📎</span> Add Photos or Documents
          <span className="text-gray-400 text-sm font-normal">(Optional, max 5 files)</span>
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors cursor-pointer bg-gray-50">
          <label className="cursor-pointer">
            <input
              type="file"
              multiple
              accept="image/*,.pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex flex-col items-center gap-2">
              <span className="text-4xl">📸</span>
              <p className="text-sm font-medium text-gray-700">Tap to upload files</p>
              <p className="text-xs text-gray-500">Images or PDF documents</p>
            </div>
          </label>
        </div>
        {files.length > 0 && (
          <div className="mt-4 space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-white border-2 border-gray-200 p-3 rounded-xl"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-xl">📄</span>
                  <span className="text-sm truncate font-medium text-gray-700">{file.name}</span>
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {(file.size / 1024).toFixed(0)} KB
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="ml-2 text-red-500 hover:text-red-700 font-medium text-sm px-3 py-1 hover:bg-red-50 rounded-lg transition-colors"
                >
                  ✕
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
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 sm:py-5 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-95"
      >
        {submitting ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            Submitting...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <span>✓</span> Submit Feedback
          </span>
        )}
      </button>

      <p className="text-center text-xs text-gray-500">
        🔒 Your information is secure and will only be used to improve our services
      </p>
    </form>
  )
}

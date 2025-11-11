import { z } from 'zod'

// Feedback form validation schema
export const feedbackSchema = z.object({
  branchId: z.string().min(1, 'Please select a branch'),
  rating: z.string().transform((val) => parseInt(val, 10)).pipe(
    z.number().min(1, 'Please select at least 1 star').max(5, 'Rating cannot exceed 5 stars')
  ),
  category: z.string().min(1, 'Please select a category'),
  comment: z.string().optional(),
  customerName: z.string().optional(),
  customerEmail: z.string().email('Please enter a valid email').optional().or(z.literal('')),
  customerPhone: z.string().optional(),
})

// Input type for the form (what React Hook Form receives)
export type FeedbackFormData = z.input<typeof feedbackSchema>

// Output type after validation (what the schema produces)
export type FeedbackData = z.output<typeof feedbackSchema>

// Login form validation schema
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export type LoginFormData = z.infer<typeof loginSchema>

// User creation validation schema
export const userCreationSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required'),
  role: z.enum(['ADMIN', 'USER']),
  branchId: z.string().optional(),
})

export type UserCreationData = z.infer<typeof userCreationSchema>

// Analytics data types
export interface AnalyticsData {
  totalFeedback: number
  averageRating: number
  ratingDistribution: {
    rating: number
    count: number
  }[]
  feedbackByCategory: {
    category: string
    count: number
  }[]
  feedbackByBranch: {
    branchName: string
    count: number
    averageRating: number
  }[]
  feedbackOverTime: {
    date: string
    count: number
  }[]
}

// Branch with feedback stats
export interface BranchWithStats {
  id: string
  name: string
  address: string
  type: string
  latitude: number
  longitude: number
  feedbackCount: number
  averageRating: number
}

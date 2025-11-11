import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { r2Client, R2_BUCKET_NAME, R2_PUBLIC_URL } from '@/lib/r2'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const branchId = formData.get('branchId') as string
    const ratingStr = formData.get('rating') as string
    const category = formData.get('category') as string
    const comment = formData.get('comment') as string || undefined
    const customerName = formData.get('customerName') as string || undefined
    const customerEmail = formData.get('customerEmail') as string || undefined
    const customerPhone = formData.get('customerPhone') as string || undefined

    // Validate required fields
    if (!branchId) {
      return NextResponse.json({ error: 'Branch ID is required' }, { status: 400 })
    }

    if (!ratingStr) {
      return NextResponse.json({ error: 'Rating is required' }, { status: 400 })
    }

    const rating = parseInt(ratingStr, 10)
    if (isNaN(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Invalid rating value' }, { status: 400 })
    }

    if (!category) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 })
    }

    // Create feedback record
    const feedback = await db.feedback.create({
      data: {
        branchId,
        rating,
        category,
        comment,
        customerName,
        customerEmail,
        customerPhone,
      },
    })

    // Handle file uploads to R2
    const files = formData.getAll('files') as File[]

    if (files.length > 0) {
      try {
        for (const file of files) {
          if (file.size > 0) {
            const bytes = await file.arrayBuffer()
            const buffer = Buffer.from(bytes)

            // Generate unique filename
            const timestamp = Date.now()
            const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
            const key = `feedback/${feedback.id}/${timestamp}-${sanitizedName}`

            // Upload to R2
            await r2Client.send(
              new PutObjectCommand({
                Bucket: R2_BUCKET_NAME,
                Key: key,
                Body: buffer,
                ContentType: file.type,
              })
            )

            // Save file reference to database
            await db.feedbackFile.create({
              data: {
                feedbackId: feedback.id,
                filename: file.name,
                filepath: `${R2_PUBLIC_URL}/${key}`,
                mimetype: file.type,
                size: file.size,
              },
            })
          }
        }
      } catch (fileError) {
        console.error('Error uploading files to R2:', fileError)
        // Continue without files - don't fail the entire feedback submission
        // Return success but indicate file upload failed
        return NextResponse.json({
          success: true,
          feedbackId: feedback.id,
          warning: 'Feedback submitted but file uploads failed. Please check R2 configuration.',
        })
      }
    }

    return NextResponse.json({ success: true, feedbackId: feedback.id })
  } catch (error) {
    console.error('Error submitting feedback:', error)
    // Return more detailed error for debugging
    const errorMessage = error instanceof Error ? error.message : 'Failed to submit feedback'
    return NextResponse.json(
      { error: 'Failed to submit feedback', details: errorMessage },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const feedback = await db.feedback.findMany({
      include: {
        branch: true,
        files: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(feedback)
  } catch (error) {
    console.error('Error fetching feedback:', error)
    return NextResponse.json(
      { error: 'Failed to fetch feedback' },
      { status: 500 }
    )
  }
}

import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { r2Client, R2_BUCKET_NAME, R2_PUBLIC_URL } from '@/lib/r2'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const branchId = formData.get('branchId') as string
    const rating = parseInt(formData.get('rating') as string)
    const category = formData.get('category') as string
    const comment = formData.get('comment') as string || undefined
    const customerName = formData.get('customerName') as string || undefined
    const customerEmail = formData.get('customerEmail') as string || undefined
    const customerPhone = formData.get('customerPhone') as string || undefined

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
    }

    return NextResponse.json({ success: true, feedbackId: feedback.id })
  } catch (error) {
    console.error('Error submitting feedback:', error)
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
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

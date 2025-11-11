import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

interface BankAPILocation {
  title: string
  address: string
  serviceNames: string
  location: string // "latitude, longitude"
  slug: string
  language: string
  id: string
}

interface BankAPIResponse {
  statusCode: number
  messages: string | null
  payload: {
    contents: BankAPILocation[]
    positionOrder: number
    pageType: string
    siteMode: string
    categoryType: string
  }
}

export async function POST() {
  try {
    // Fetch data from Bank of Baku API
    const response = await fetch(
      'https://site-api.bankofbaku.com/categories/serviceNetwork/individual',
      {
        headers: {
          'Accept': 'application/json',
          'Origin': 'https://www.bankofbaku.com',
          'Referer': 'https://www.bankofbaku.com/',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Bank API returned ${response.status}`)
    }

    const data: BankAPIResponse = await response.json()

    if (!data.payload || !data.payload.contents) {
      throw new Error('Invalid API response structure')
    }

    // Filter for English language entries only to avoid duplicates
    const englishLocations = data.payload.contents.filter(
      (loc) => loc.language === 'en'
    )

    let created = 0
    let updated = 0
    let errors = 0

    // Sync each location with database
    for (const location of englishLocations) {
      try {
        // Parse location string "latitude, longitude"
        const [latStr, lngStr] = location.location.split(',').map((s) => s.trim())
        const latitude = parseFloat(latStr)
        const longitude = parseFloat(lngStr)

        if (isNaN(latitude) || isNaN(longitude)) {
          console.error(`Invalid coordinates for ${location.title}: ${location.location}`)
          errors++
          continue
        }

        // Determine type based on title
        let type = 'Branch'
        const titleLower = location.title.toLowerCase()
        if (titleLower.includes('atm')) {
          type = 'ATM'
        } else if (titleLower.includes('terminal')) {
          type = 'Payment Terminal'
        }

        // Upsert branch using external ID as unique identifier
        const externalId = `bank-api-${location.id}`

        const branch = await db.branch.upsert({
          where: { qrCode: externalId },
          create: {
            name: location.title,
            address: location.address,
            type,
            services: location.serviceNames,
            latitude,
            longitude,
            qrCode: externalId,
          },
          update: {
            name: location.title,
            address: location.address,
            type,
            services: location.serviceNames,
            latitude,
            longitude,
          },
        })

        if (branch.createdAt.getTime() === branch.updatedAt.getTime()) {
          created++
        } else {
          updated++
        }
      } catch (error) {
        console.error(`Error syncing location ${location.title}:`, error)
        errors++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sync completed: ${created} created, ${updated} updated, ${errors} errors`,
      stats: {
        total: englishLocations.length,
        created,
        updated,
        errors,
      },
    })
  } catch (error) {
    console.error('Error syncing branches:', error)
    return NextResponse.json(
      {
        error: 'Failed to sync branches',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Fetch data from Bank of Baku API without saving
    const response = await fetch(
      'https://site-api.bankofbaku.com/categories/serviceNetwork/individual',
      {
        headers: {
          'Accept': 'application/json',
          'Origin': 'https://www.bankofbaku.com',
          'Referer': 'https://www.bankofbaku.com/',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Bank API returned ${response.status}`)
    }

    const data: BankAPIResponse = await response.json()

    if (!data.payload || !data.payload.contents) {
      throw new Error('Invalid API response structure')
    }

    // Filter for English language entries and transform
    const branches = data.payload.contents
      .filter((loc) => loc.language === 'en')
      .map((location) => {
        const [latStr, lngStr] = location.location.split(',').map((s) => s.trim())
        const latitude = parseFloat(latStr)
        const longitude = parseFloat(lngStr)

        let type = 'Branch'
        const titleLower = location.title.toLowerCase()
        if (titleLower.includes('atm')) {
          type = 'ATM'
        } else if (titleLower.includes('terminal')) {
          type = 'Payment Terminal'
        }

        return {
          id: location.id,
          name: location.title,
          address: location.address,
          type,
          services: location.serviceNames,
          latitude,
          longitude,
        }
      })
      .filter((branch) => !isNaN(branch.latitude) && !isNaN(branch.longitude))

    return NextResponse.json({
      success: true,
      count: branches.length,
      branches,
    })
  } catch (error) {
    console.error('Error fetching branches from Bank API:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch branches',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

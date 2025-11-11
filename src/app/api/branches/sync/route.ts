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
    pages: Array<{
      informationGroup: Array<{
        listGroup: Array<{
          lists: BankAPILocation[]
        }>
      }>
    }>
    positionOrder: number
    pageType: string
    siteMode: string
    categoryType: string
  }
}

// Decode HTML entities
function decodeHTMLEntities(text: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&laquo;': '«',
    '&raquo;': '»',
    '&ccedil;': 'ç',
    '&Ccedil;': 'Ç',
    '&nbsp;': ' ',
    '&ndash;': '–',
    '&mdash;': '—',
  }

  return text.replace(/&[a-zA-Z0-9#]+;/g, (entity) => entities[entity] || entity)
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

    if (!data.payload || !data.payload.pages) {
      throw new Error('Invalid API response structure')
    }

    // Flatten nested structure to get all locations
    const allLocations: BankAPILocation[] = []
    for (const page of data.payload.pages) {
      if (!page.informationGroup) continue
      for (const infoGroup of page.informationGroup) {
        if (!infoGroup.listGroup) continue
        for (const listGroup of infoGroup.listGroup) {
          if (!listGroup.lists) continue
          allLocations.push(...listGroup.lists)
        }
      }
    }

    // Filter for English language entries only to avoid duplicates
    const englishLocations = allLocations.filter(
      (loc) => loc.language === 'en'
    )

    let created = 0
    let updated = 0
    let errors = 0

    // Sync each location with database
    for (const location of englishLocations) {
      try {
        // Validate location data
        if (!location.location || typeof location.location !== 'string') {
          console.error(`Missing or invalid location for ${location.title || 'unknown'}`)
          errors++
          continue
        }

        // Parse location string "latitude, longitude"
        const parts = location.location.split(',')
        if (parts.length !== 2) {
          console.error(`Invalid location format for ${location.title}: ${location.location}`)
          errors++
          continue
        }

        const [latStr, lngStr] = parts.map((s) => s.trim())
        const latitude = parseFloat(latStr)
        const longitude = parseFloat(lngStr)

        if (isNaN(latitude) || isNaN(longitude)) {
          console.error(`Invalid coordinates for ${location.title}: ${location.location}`)
          errors++
          continue
        }

        // Clean title by removing HTML tags and decoding entities
        const cleanTitle = decodeHTMLEntities(
          (location.title || '').replace(/<[^>]*>/g, '').trim()
        )

        // Determine type based on title
        let type = 'Branch'
        const titleLower = cleanTitle.toLowerCase()
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
            name: cleanTitle,
            address: location.address || 'No address',
            type,
            services: location.serviceNames || 'No services listed',
            latitude,
            longitude,
            qrCode: externalId,
          },
          update: {
            name: cleanTitle,
            address: location.address || 'No address',
            type,
            services: location.serviceNames || 'No services listed',
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

    if (!data.payload || !data.payload.pages) {
      throw new Error('Invalid API response structure')
    }

    // Flatten nested structure to get all locations
    const allLocations: BankAPILocation[] = []
    for (const page of data.payload.pages) {
      if (!page.informationGroup) continue
      for (const infoGroup of page.informationGroup) {
        if (!infoGroup.listGroup) continue
        for (const listGroup of infoGroup.listGroup) {
          if (!listGroup.lists) continue
          allLocations.push(...listGroup.lists)
        }
      }
    }

    // Filter for English language entries and transform
    const branches = allLocations
      .filter((loc) => loc.language === 'en')
      .map((location) => {
        // Handle missing or invalid location data
        if (!location.location || typeof location.location !== 'string') {
          return null
        }

        const parts = location.location.split(',')
        if (parts.length !== 2) {
          return null
        }

        const [latStr, lngStr] = parts.map((s) => s.trim())
        const latitude = parseFloat(latStr)
        const longitude = parseFloat(lngStr)

        if (isNaN(latitude) || isNaN(longitude)) {
          return null
        }

        // Clean title by removing HTML tags and decoding entities
        const cleanTitle = decodeHTMLEntities(
          (location.title || '').replace(/<[^>]*>/g, '').trim()
        ) || 'Unnamed Location'

        let type = 'Branch'
        const titleLower = cleanTitle.toLowerCase()
        if (titleLower.includes('atm')) {
          type = 'ATM'
        } else if (titleLower.includes('terminal')) {
          type = 'Payment Terminal'
        }

        return {
          id: location.id,
          name: cleanTitle,
          address: location.address || 'No address',
          type,
          services: location.serviceNames || 'No services listed',
          latitude,
          longitude,
        }
      })
      .filter((branch): branch is NonNullable<typeof branch> => branch !== null)

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

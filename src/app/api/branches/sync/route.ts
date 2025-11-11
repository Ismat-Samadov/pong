import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

interface BankAPIList {
  title: string
  address: string
  serviceNames: string
  location: string | null // null in lists
  slug: string
  language: string
  id: string
}

interface BankAPIListGroup {
  id: string
  location: string | null // coordinates here! "lat, lng"
  lists: BankAPIList[]
}

interface BankAPIResponse {
  statusCode: number
  messages: string | null
  payload: {
    pages: Array<{
      informationGroup: Array<{
        listGroup: BankAPIListGroup[]
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

    // Flatten nested structure and assign coordinates from listGroup to each list
    const allLocations: Array<BankAPIList & { groupLocation: string }> = []
    for (const page of data.payload.pages) {
      if (!page.informationGroup) continue
      for (const infoGroup of page.informationGroup) {
        if (!infoGroup.listGroup) continue
        for (const listGroup of infoGroup.listGroup) {
          if (!listGroup.lists || !listGroup.location) continue

          // Each list in this group gets the group's location
          for (const list of listGroup.lists) {
            allLocations.push({
              ...list,
              groupLocation: listGroup.location,
            })
          }
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
        // Validate location data (now from groupLocation)
        if (!location.groupLocation || typeof location.groupLocation !== 'string') {
          console.error(`Missing or invalid location for ${location.title || 'unknown'}`)
          errors++
          continue
        }

        // Parse location string "latitude, longitude"
        const parts = location.groupLocation.split(',')
        if (parts.length !== 2) {
          console.error(`Invalid location format for ${location.title}: ${location.groupLocation}`)
          errors++
          continue
        }

        const [latStr, lngStr] = parts.map((s: string) => s.trim())
        const latitude = parseFloat(latStr)
        const longitude = parseFloat(lngStr)

        if (isNaN(latitude) || isNaN(longitude)) {
          console.error(`Invalid coordinates for ${location.title}: ${location.groupLocation}`)
          errors++
          continue
        }

        // Clean title by removing HTML tags and decoding entities
        const cleanTitle = decodeHTMLEntities(
          (location.title || '').replace(/<[^>]*>/g, '').trim()
        )

        // Determine type based on title (standardized plural forms)
        const titleLower = cleanTitle.toLowerCase()
        let type = 'Branches'

        if (titleLower.includes('atm')) {
          type = 'ATMs'
        } else if (titleLower.includes('terminal')) {
          type = 'Payment Terminals'
        } else if (
          // Check if it's actually a branch/filial/office
          !titleLower.includes('branch') &&
          !titleLower.includes('filial') &&
          !titleLower.includes('office')
        ) {
          // It's a service point (mall, travel agency, etc)
          type = 'Service Points'
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

    // Flatten nested structure and assign coordinates from listGroup to each list
    const allLocations: Array<BankAPIList & { groupLocation: string }> = []
    for (const page of data.payload.pages) {
      if (!page.informationGroup) continue
      for (const infoGroup of page.informationGroup) {
        if (!infoGroup.listGroup) continue
        for (const listGroup of infoGroup.listGroup) {
          if (!listGroup.lists || !listGroup.location) continue

          // Each list in this group gets the group's location
          for (const list of listGroup.lists) {
            allLocations.push({
              ...list,
              groupLocation: listGroup.location,
            })
          }
        }
      }
    }

    // Filter for English language entries and transform
    const branches = allLocations
      .filter((loc) => loc.language === 'en')
      .map((location) => {
        // Handle missing or invalid location data (now from groupLocation)
        if (!location.groupLocation || typeof location.groupLocation !== 'string') {
          return null
        }

        const parts = location.groupLocation.split(',')
        if (parts.length !== 2) {
          return null
        }

        const [latStr, lngStr] = parts.map((s: string) => s.trim())
        const latitude = parseFloat(latStr)
        const longitude = parseFloat(lngStr)

        if (isNaN(latitude) || isNaN(longitude)) {
          return null
        }

        // Clean title by removing HTML tags and decoding entities
        const cleanTitle = decodeHTMLEntities(
          (location.title || '').replace(/<[^>]*>/g, '').trim()
        ) || 'Unnamed Location'

        // Determine type based on title (standardized plural forms)
        const titleLower = cleanTitle.toLowerCase()
        let type = 'Branches'

        if (titleLower.includes('atm')) {
          type = 'ATMs'
        } else if (titleLower.includes('terminal')) {
          type = 'Payment Terminals'
        } else if (
          // Check if it's actually a branch/filial/office
          !titleLower.includes('branch') &&
          !titleLower.includes('filial') &&
          !titleLower.includes('office')
        ) {
          // It's a service point (mall, travel agency, etc)
          type = 'Service Points'
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

import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const prisma = new PrismaClient()

const categories = [
  'Service',
  'Cleanliness',
  'Speed',
  'Staff Behavior',
  'Facilities',
  'Overall Experience',
]

const sampleComments = [
  'Excellent service! Staff was very helpful and professional.',
  'Quick and efficient. No wait time.',
  'Very satisfied with the service provided.',
  'Staff could be more friendly, but service was good.',
  'Great location and easy to access.',
  'Waited a bit long but staff was helpful.',
  'Professional service, will come again.',
  'Clean and well-organized branch.',
  'Staff needs more training on products.',
  'Outstanding customer service experience!',
  'Average experience, nothing special.',
  'Very helpful staff, explained everything clearly.',
  'Modern facilities and good service.',
  'Could improve waiting area comfort.',
  'Fast service, very convenient location.',
]

const sampleNames = [
  'Ali Mammadov',
  'Leyla Hasanova',
  'Elvin Ismayilov',
  'Aysel Aliyeva',
  'Rashad Huseynov',
  'Nigar Rahimova',
  'Vugar Safarov',
  'Sevinj Mustafayeva',
  'Kamran Jafarov',
  'Gulnar Ahmadova',
]

const sampleEmails = [
  'ali.m@example.com',
  'leyla.h@example.com',
  'elvin.i@example.com',
  'aysel.a@example.com',
  'rashad.h@example.com',
  'nigar.r@example.com',
  'vugar.s@example.com',
  'sevinj.m@example.com',
  'kamran.j@example.com',
  'gulnar.a@example.com',
]

const samplePhones = [
  '+994501234567',
  '+994502345678',
  '+994503456789',
  '+994504567890',
  '+994505678901',
  '+994506789012',
  '+994507890123',
  '+994508901234',
  '+994509012345',
  '+994550123456',
]

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

function getRandomRating(): number {
  // Weighted towards higher ratings (more realistic)
  const rand = Math.random()
  if (rand < 0.5) return 5 // 50% chance of 5 stars
  if (rand < 0.75) return 4 // 25% chance of 4 stars
  if (rand < 0.9) return 3 // 15% chance of 3 stars
  if (rand < 0.95) return 2 // 5% chance of 2 stars
  return 1 // 5% chance of 1 star
}

function getRandomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

async function seedFeedback() {
  console.log('Starting to seed feedback data...')

  // Get all branches (only actual branches, not ATMs or terminals for more realistic feedback)
  const branches = await prisma.branch.findMany({
    where: {
      type: {
        contains: 'Branch',
      },
    },
  })

  if (branches.length === 0) {
    console.error('No branches found! Please run branch sync first.')
    return
  }

  console.log(`Found ${branches.length} branches to seed feedback for`)

  // Create feedback for the last 3 months
  const endDate = new Date()
  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - 3)

  let created = 0

  // Create 50-100 feedback entries across all branches
  const totalFeedback = 50 + Math.floor(Math.random() * 51)

  for (let i = 0; i < totalFeedback; i++) {
    const branch = getRandomElement(branches)
    const rating = getRandomRating()
    const createdAt = getRandomDate(startDate, endDate)

    try {
      await prisma.feedback.create({
        data: {
          branchId: branch.id,
          rating,
          category: getRandomElement(categories),
          comment: getRandomElement(sampleComments),
          customerName: getRandomElement(sampleNames),
          customerEmail: getRandomElement(sampleEmails),
          customerPhone: getRandomElement(samplePhones),
          createdAt,
        },
      })

      created++
      if (created % 10 === 0) {
        console.log(`Created ${created}/${totalFeedback} feedback entries...`)
      }
    } catch (error) {
      console.error(`Error creating feedback:`, error)
    }
  }

  console.log(`\nDone! Created ${created} feedback entries across ${branches.length} branches`)

  // Show stats
  const stats = await prisma.feedback.groupBy({
    by: ['rating'],
    _count: {
      rating: true,
    },
    orderBy: {
      rating: 'desc',
    },
  })

  console.log('\nFeedback distribution by rating:')
  stats.forEach((stat) => {
    const stars = '⭐'.repeat(stat.rating)
    console.log(`${stars} (${stat.rating}): ${stat._count.rating} feedback`)
  })
}

seedFeedback()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })

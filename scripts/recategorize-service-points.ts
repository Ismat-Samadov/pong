import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const prisma = new PrismaClient()

async function recategorizeServicePoints() {
  console.log('Recategorizing non-branch locations as Service Points...')

  // Get all branches
  const branches = await prisma.branch.findMany({
    where: { type: 'Branches' }
  })

  let updated = 0

  for (const branch of branches) {
    const name = branch.name.toLowerCase()

    // Check if this is NOT an actual branch
    const isNotBranch = !name.includes('branch') &&
                        !name.includes('filial') &&
                        !name.includes('office')

    if (isNotBranch) {
      await prisma.branch.update({
        where: { id: branch.id },
        data: { type: 'Service Points' }
      })
      console.log(`  Moved to Service Points: ${branch.name}`)
      updated++
    }
  }

  console.log(`\nDone! Recategorized ${updated} locations as Service Points`)

  // Show final distribution
  const finalTypes = await prisma.branch.groupBy({
    by: ['type'],
    _count: { type: true },
  })

  console.log('\nFinal type distribution:')
  finalTypes.forEach((type) => {
    console.log(`  ${type.type}: ${type._count.type}`)
  })

  await prisma.$disconnect()
}

recategorizeServicePoints()

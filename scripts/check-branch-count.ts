import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const prisma = new PrismaClient()

async function checkBranches() {
  // Get all branches type
  const branches = await prisma.branch.findMany({
    where: { type: 'Branches' },
    select: { name: true, type: true }
  })

  // Find actual branches (with 'Branch' or 'filial' in name)
  const actualBranches = branches.filter(b =>
    b.name.toLowerCase().includes('branch') ||
    b.name.toLowerCase().includes('filial') ||
    b.name.toLowerCase().includes('office')
  )

  console.log('Total with type "Branches":', branches.length)
  console.log('Actual bank branches:', actualBranches.length)
  console.log('\nNot real branches:', branches.length - actualBranches.length)

  // Show some non-branch examples
  const notBranches = branches.filter(b => {
    const name = b.name.toLowerCase()
    return !name.includes('branch') &&
           !name.includes('filial') &&
           !name.includes('office')
  })

  console.log('\nExamples of non-branch locations:')
  notBranches.slice(0, 15).forEach(b => console.log('  -', b.name))

  await prisma.$disconnect()
}

checkBranches()

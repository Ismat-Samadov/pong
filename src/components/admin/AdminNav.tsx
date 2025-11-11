'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'

interface AdminNavProps {
  user: {
    name: string
    email: string
    role: string
  }
}

export default function AdminNav({ user }: AdminNavProps) {
  const pathname = usePathname()

  const navItems = [
    { href: '/admin/dashboard', label: 'Dashboard' },
    { href: '/admin/branches', label: 'Branches' },
    { href: '/admin/branches-sync', label: 'Sync' },
    { href: '/admin/map', label: 'Map' },
    { href: '/admin/analytics', label: 'Analytics' },
    { href: '/admin/feedback-links', label: 'Links' },
    { href: '/admin/custom-fields', label: 'Fields' },
    ...(user.role === 'ADMIN' ? [{ href: '/admin/users', label: 'Users' }] : []),
  ]

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/admin/dashboard" className="text-xl font-bold text-blue-600">
              Feedback System
            </Link>
            <div className="flex space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                    pathname === item.href
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {user.name} ({user.role})
            </span>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700 transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

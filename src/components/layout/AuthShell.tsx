'use client'

import { usePathname } from 'next/navigation'
import { Navigation } from './Navigation'
import { Ticker } from './Ticker'

export function AuthShell() {
  const pathname = usePathname()
  if (pathname === '/login' || pathname === '/pending') return null

  return (
    <>
      <Navigation />
      <Ticker />
    </>
  )
}

import { Outlet } from 'react-router-dom'
import { PublicFooter } from './PublicFooter.tsx'
import { PublicHeader } from './PublicHeader.tsx'

export function PublicLayout() {
  return (
    <div className="bg-background min-h-svh flex flex-col">
      <PublicHeader />
      <Outlet />
      <PublicFooter />
    </div>
  )
}

import type { Metadata } from 'next'
import AdminHeader from '@/components/admin/AdminHeader'
import SermonsManager from '@/components/admin/SermonsManager'
import { readManualVideoIds } from '@/lib/admin/youtube-settings'

export const metadata: Metadata = {
  title: 'Sermons | Admin | Amazing Grace Ministries MN',
}

export const dynamic = 'force-dynamic'

export default async function AdminSermonsPage() {
  const ids = await readManualVideoIds()

  return (
    <div>
      <AdminHeader
        title="Sermons"
        description="Control which YouTube videos appear on the sermons page. Pin services manually, or leave the list empty to follow the channel automatically."
      />
      <SermonsManager initialIds={ids} />
    </div>
  )
}

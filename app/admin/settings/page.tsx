import type { Metadata } from 'next'
import AdminHeader from '@/components/admin/AdminHeader'
import SettingsForm from '@/components/admin/SettingsForm'
import { readSiteSettings } from '@/lib/admin/site-settings'

export const metadata: Metadata = {
  title: 'Site Settings | Admin | Amazing Grace Ministries MN',
}

export const dynamic = 'force-dynamic'

export default async function AdminSettingsPage() {
  const settings = await readSiteSettings()

  return (
    <div>
      <AdminHeader
        title="Site Settings"
        description="Service times, address, dial-in numbers, socials, and the announcement bar. Saved to the settings/site document — public pages will read it once the read-side swap lands."
      />
      <SettingsForm initial={settings} />
    </div>
  )
}

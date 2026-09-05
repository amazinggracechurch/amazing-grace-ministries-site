import type { Metadata } from 'next'
import AdminHeader from '@/components/admin/AdminHeader'
import QrGenerator from '@/components/admin/QrGenerator'

export const metadata: Metadata = {
  title: 'QR Generator | Admin | Amazing Grace Ministries MN',
}

export const dynamic = 'force-dynamic'

export default function AdminQrPage() {
  return (
    <div>
      <AdminHeader
        title="QR Generator"
        description="Giving QR codes for bulletins, the foyer, and screens. Each code links to a pre-filled Stripe Checkout gift."
      />
      <QrGenerator />
    </div>
  )
}

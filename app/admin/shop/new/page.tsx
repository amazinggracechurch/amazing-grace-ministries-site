import type { Metadata } from 'next'
import AdminHeader from '@/components/admin/AdminHeader'
import ProductForm from '@/components/admin/ProductForm'

export const metadata: Metadata = {
  title: 'New Product | Admin | Amazing Grace Ministries MN',
}

export default function NewProductPage() {
  return (
    <div>
      <AdminHeader title="New product" description="Merch for pickup at Sunday service." />
      <ProductForm />
    </div>
  )
}

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import AdminHeader from '@/components/admin/AdminHeader'
import ProductForm from '@/components/admin/ProductForm'
import { getProductById } from '@/lib/shop'

export const metadata: Metadata = {
  title: 'Edit Product | Admin | Amazing Grace Ministries MN',
}

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function EditProductPage({ params }: PageProps) {
  const { id } = await params
  const product = await getProductById(id)
  if (!product) notFound()

  return (
    <div>
      <AdminHeader title={product.title} description={`Editing /shop/${product.slug}`} />
      <ProductForm initial={product} />
    </div>
  )
}

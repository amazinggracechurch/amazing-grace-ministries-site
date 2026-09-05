import type { ReactNode } from 'react'
import AnnouncementBar from '@/components/AnnouncementBar'
import Footer from '@/components/Footer'
import Navbar from '@/components/Navbar'
import CartDrawer from '@/components/shop/CartDrawer'
import { CartProvider } from '@/components/shop/CartProvider'

/**
 * Everything under /shop shares one cart: provider + slide-out drawer.
 * The Navbar's cart icon mirrors the count via localStorage events (see
 * CartNavButton), so it does not need this provider.
 */
export default function ShopLayout({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      <Navbar />
      <AnnouncementBar />
      {children}
      <CartDrawer />
      <Footer />
    </CartProvider>
  )
}

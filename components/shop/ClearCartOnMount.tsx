'use client'
import { useEffect } from 'react'
import { useCart } from './CartProvider'

/** Payment succeeded — empty the cart (local + server copy) on mount. */
export default function ClearCartOnMount() {
  const { clearCart } = useCart()
  useEffect(() => clearCart(), [clearCart])
  return null
}

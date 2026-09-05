'use client'
import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'
import ThemeToggle from './ThemeToggle'
import AuthMenu from './auth/AuthMenu'
import CartNavButton from './shop/CartNavButton'
import Image from 'next/image'
import Link from 'next/link'

const navLinks = [
  { label: 'About', href: '/about' },
  { label: 'Plan Your Visit', href: '/plan-your-visit' },
  { label: 'Sermons', href: '/sermons' },
  { label: 'Blog', href: '/blog' },
  { label: 'Events', href: '/events' },
  { label: 'Shop', href: '/shop' },
  { label: 'Give', href: '/give' },
  { label: 'Contact', href: '/contact' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav
      aria-label="Primary"
      className={`fixed top-0 left-0 right-0 z-50 h-[72px] transition-colors duration-200 border-b ${
        scrolled || menuOpen
          ? 'bg-surface/95 backdrop-blur-md border-border-subtle'
          : 'bg-transparent border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
        {/* Logo zone */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-12 h-12 rounded-full border border-border-subtle bg-surface-raised flex items-center justify-center group-hover:border-accent transition-colors duration-200">
            <Image
              src="/logo-white.svg"
              alt=""
              width={44}
              height={44}
              priority
              className="object-contain hidden dark:block"
            />
            <Image
              src="/logo-dark.svg"
              alt=""
              width={44}
              height={44}
              priority
              className="object-contain dark:hidden"
            />
          </div>
          <div>
            <span className="block font-display font-semibold text-subheading leading-tight text-text-primary group-hover:text-accent transition-colors duration-200">
              Amazing Grace
            </span>
            <span className="block eyebrow text-text-muted">
              Ministries MN
            </span>
          </div>
        </Link>

        {/* Desktop navigation */}
        <div className="hidden lg:flex items-center gap-8">
          <ul className="flex items-center gap-6">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="font-body font-semibold text-body-sm uppercase tracking-[0.08em] relative text-text-secondary hover:text-accent transition-colors duration-200 after:absolute after:bottom-[-2px] after:left-0 after:w-0 after:h-px after:bg-accent after:transition-[width] after:duration-200 hover:after:w-full"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-5">
            <CartNavButton />
            <AuthMenu />
            <ThemeToggle />
            <Link
              href="/plan-your-visit"
              className="bg-accent text-on-accent hover:bg-accent-hover font-body font-bold text-caption uppercase tracking-[0.1em] px-5 py-2.5 transition-colors duration-200"
            >
              Join Us Sunday
            </Link>
          </div>
        </div>

        {/* Mobile menu trigger */}
        <div className="flex items-center gap-4 lg:hidden">
          <CartNavButton />
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            className="text-text-primary hover:text-accent transition-colors duration-200"
          >
            {menuOpen ? <X className="w-6 h-6" aria-hidden /> : <Menu className="w-6 h-6" aria-hidden />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="absolute top-[72px] left-0 right-0 z-40 flex flex-col bg-surface border-b border-border-subtle p-6 lg:hidden">
          <ul className="flex flex-col gap-4 mb-6">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="block font-body font-semibold text-body-sm uppercase tracking-[0.08em] text-text-secondary hover:text-accent transition-colors duration-200"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center justify-between gap-4">
            <AuthMenu />
            <Link
              href="/plan-your-visit"
              onClick={() => setMenuOpen(false)}
              className="flex-1 text-center bg-accent text-on-accent hover:bg-accent-hover font-body font-bold text-caption uppercase tracking-[0.1em] py-3 transition-colors duration-200"
            >
              Join Us Sunday
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}

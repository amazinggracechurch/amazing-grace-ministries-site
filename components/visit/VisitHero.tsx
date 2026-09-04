import Image from 'next/image'
import { ChevronDown } from 'lucide-react'

export default function VisitHero() {
  return (
    <section
      className="relative min-h-[60vh] flex flex-col items-center justify-center overflow-hidden bg-light-charcoal dark:bg-dark-black"
    >
      {/* ===== VISIT HERO ===== */}
      {/* Background image layer */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Placeholder: Gradient background */}
        <div className="w-full h-full bg-gradient-to-br from-dark-elevated via-dark-section to-dark-black opacity-60" />
        
        {/* Production Image:
        */}
        <Image
          src="/images/worship-band-bw.jpg"
          alt="Plan Your Visit Hero Image"
          fill
          priority
          className="object-cover opacity-40"
        />
      </div>

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60 z-[1] pointer-events-none" />

      {/* Left side diagonal vector border */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[60px] bg-white/[0.03] pointer-events-none z-[2]"
        style={{ clipPath: 'polygon(0 0, 100% 5%, 100% 95%, 0 100%)' }}
      />

      {/* Right side diagonal vector border */}
      <div
        className="absolute right-0 top-0 bottom-0 w-[60px] bg-white/[0.03] pointer-events-none z-[2]"
        style={{ clipPath: 'polygon(100% 0, 0 5%, 0 95%, 100% 100%)' }}
      />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto py-24 reveal">
        <span className="font-body font-semibold text-[11px] uppercase tracking-[0.2em] text-gold mb-4 block">
          HOME / PLAN YOUR VISIT
        </span>
        <h1 className="font-display font-bold text-[44px] md:text-[72px] lg:text-[84px] leading-[1.02] text-white">
          WE&apos;VE BEEN <span className="font-display italic text-gold block">Expecting You.</span>
        </h1>
        <div className="w-16 h-[2px] bg-gold mx-auto mt-6 mb-8" />
        <p className="font-display italic text-[20px] text-white/60">
          &ldquo;Come as you are. You are welcome here.&rdquo;
        </p>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
        <span className="font-body text-[11px] uppercase tracking-widest text-white/40">
          Scroll
        </span>
        <ChevronDown className="w-4 h-4 text-gold animate-bounce" />
      </div>
    </section>
  )
}


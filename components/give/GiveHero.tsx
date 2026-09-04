import { ChevronDown, Heart } from 'lucide-react'
import Image from 'next/image'

export default function GiveHero() {
  return (
    <section
      className="
        relative min-h-[60vh] flex flex-col items-center justify-center overflow-hidden
        bg-light-charcoal dark:bg-dark-black
      "
    >
      {/* Background image layer */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Placeholder: Gradient background */}
        <div className="w-full h-full bg-gradient-to-br from-dark-elevated via-dark-section to-dark-black opacity-60" />
        
        {/* Production Image:
        */}
        <Image
          src="/images/worship-band-bw.jpg"
          alt="Generosity and Giving Hero Image"
          fill
          priority
          className="object-cover opacity-35"
        />
      </div>

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/65 z-[1] pointer-events-none" />

      {/* Left side diagonal vector border */}
      <div
        className="
          absolute left-0 top-0 bottom-0 w-[60px] bg-white/[0.03] pointer-events-none z-[2]
        "
        style={{ clipPath: 'polygon(0 0, 100% 5%, 100% 95%, 0 100%)' }}
      />

      {/* Right side diagonal vector border */}
      <div
        className="
          absolute right-0 top-0 bottom-0 w-[60px] bg-white/[0.03] pointer-events-none z-[2]
        "
        style={{ clipPath: 'polygon(100% 0, 0 5%, 0 95%, 100% 100%)' }}
      />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto py-24 reveal">
        <span className="font-body font-semibold text-[11px] uppercase tracking-[0.2em] text-gold mb-4 block">
          HOME / GIVE
        </span>
        <h1 className="font-display font-bold text-[44px] md:text-[72px] lg:text-[84px] leading-[1.02] text-white">
          GIVE WITH <span className="font-display italic text-gold block">A Generous Heart.</span>
        </h1>
        <div className="w-16 h-[2px] bg-gold mx-auto mt-6 mb-8" />
        <p className="font-display italic text-[20px] text-white/60">
          &ldquo;Each of you should give what you have decided in your heart to give.&rdquo; &mdash; 2 Corinthians 9:7
        </p>

        {/* Give Online Now CTA */}
        <div className="mt-8">
          <a
            href="#giving-form"
            className="
              inline-flex items-center gap-3 bg-gold text-dark-charcoal font-body font-bold text-[13px] uppercase tracking-[0.1em] px-8 py-4 rounded-sm
              hover:bg-gold-light hover:-translate-y-0.5 transition-all shadow-gold
            "
          >
            <Heart className="w-4 h-4 text-dark-charcoal fill-dark-charcoal" />
            Give Online Now
          </a>
        </div>
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

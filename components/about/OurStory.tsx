import Image from 'next/image'
import { Users } from 'lucide-react'

export default function OurStory() {
  return (
    <section
      className="py-24 px-6 bg-light-gray dark:bg-dark-charcoal transition-colors duration-300"
    >
      {/* ===== OUR STORY ===== */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        
        {/* Left — image + stat */}
        <div className="relative reveal">
          <div className="w-full h-[480px] rounded-2xl overflow-hidden shadow-ph-deeper relative">
            {/* Placeholder: Gradient background */}
            <div className="w-full h-full bg-gradient-to-br from-dark-elevated via-dark-section to-dark-black" />

            {/* Production Image:
            */}
            <Image
              src="/images/hero-worship.jpg"
              alt="Amazing Grace Ministries community gathering"
              fill
              className="object-cover"
            />
          </div>

          {/* Floating stat card */}
          <div
            className="
              relative md:absolute md:bottom-[-20px] md:right-[-20px] mt-6 md:mt-0
              w-full md:w-auto border rounded-xl p-6 shadow-ph-dark transition-all duration-300
              bg-light-white border-light-mid
              dark:bg-dark-card dark:border-dark-border
            "
          >
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-3.5 h-3.5 text-gold" />
              <span className="font-body font-semibold text-[10px] uppercase tracking-widest text-gold">
                OUR COMMUNITY
              </span>
            </div>
            <div className="font-display font-bold text-[48px] leading-none text-light-charcoal dark:text-white">
              100%
            </div>
            <span className="font-body text-[13px] block mt-1 text-light-secondary dark:text-white/55">
              Fulfilled Members
            </span>
          </div>
        </div>

        {/* Right — text */}
        <div className="reveal reveal-delay-1">
          <span className="font-body font-semibold text-[11px] uppercase tracking-[0.18em] text-gold">
            OUR STORY
          </span>
          <div className="w-10 h-[2px] bg-gold mt-2 mb-6" />
          
          <h2 className="font-display font-bold text-[48px] leading-tight text-light-charcoal dark:text-white">
            More Than a Church.
          </h2>
          <p className="font-display italic text-[24px] text-gold mt-2">
            A Family on Mission.
          </p>

          <div className="font-body text-[16px] leading-[1.85] mt-6 space-y-4 text-light-secondary dark:text-white/65">
            <p>
              Welcome to Amazing Grace Ministries! We are delighted to have you join our vibrant and loving community, led by our charismatic Senior Pastor, Nnaemeka Uchegbu.
            </p>
            <p>
              At Amazing Grace, we are committed to spreading hope, love, and the teachings of Christ. We provide a warm and nurturing environment where you can grow spiritually through engaging sermons, interactive Bible studies, and meaningful fellowship.
            </p>
            <p>
              Our diverse, non-denominational community is dedicated to supporting one another on the journey of faith, offering various opportunities for personal development and spiritual renewal. We look forward to welcoming you with open arms as we journey together towards a closer walk with God.
            </p>
          </div>

          <div className="border-l-2 border-gold pl-5 mt-8">
            <p className="font-display italic text-[20px] text-light-charcoal dark:text-white/80">
              &ldquo;For where two or three gather in my name, there am I with them.&rdquo;
            </p>
            <p className="font-body text-[13px] text-gold mt-2">
              &mdash; Matthew 18:20
            </p>
          </div>
        </div>

      </div>
    </section>
  )
}


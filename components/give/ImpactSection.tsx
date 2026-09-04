import { Users, Globe, BookOpen, Heart } from 'lucide-react'
import Image from 'next/image'

export default function ImpactSection() {
  const areas = [
    {
      icon: Users,
      title: 'Sunday Services',
      body: 'Funding world-class worship, media, and teaching every single week.',
    },
    {
      icon: Globe,
      title: 'Missions & Outreach',
      body: 'Reaching our city and supporting missionaries around the world.',
    },
    {
      icon: BookOpen,
      title: 'Discipleship & Education',
      body: 'Bible studies, youth programs, and resources to help people grow.',
    },
    {
      icon: Heart,
      title: 'Community Care',
      body: 'Supporting families in need through our benevolence fund.',
    },
  ]

  return (
    <section
      className="
        py-24 px-6
        bg-light-gray dark:bg-dark-charcoal
        transition-colors duration-300
      "
    >
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        
        {/* Left Column — Image + Stat Card */}
        <div className="relative reveal">
          <div className="w-full h-[460px] rounded-2xl overflow-hidden shadow-ph-deeper relative">
            {/* Placeholder: Gradient background */}
            <div className="w-full h-full bg-gradient-to-br from-dark-elevated via-dark-section to-dark-black" />

            {/* Production Image:
            */}
            <Image
              src="/images/worship-band-bw.jpg"
              alt="Community impact illustration image"
              fill
              className="object-cover"
            />
          </div>

          {/* Floating stat card (hidden on mobile, shown on sm+) */}
          <div
            className="
              absolute bottom-[-20px] right-[-20px] border rounded-xl p-6 shadow-ph-dark z-10 transition-colors duration-300 hidden sm:block
              bg-light-white border-light-mid
              dark:bg-dark-card dark:border-dark-border
            "
          >
            <span className="font-body font-semibold text-[10px] uppercase tracking-widest text-gold block">
              YOUR IMPACT
            </span>
            <div className="font-display font-bold text-[52px] leading-none text-light-charcoal dark:text-white mt-1">
              100%
            </div>
            <span className="font-body text-[13px] text-light-secondary dark:text-white/55 block mt-1">
              Goes directly to ministry
            </span>
          </div>

          {/* Mobile representation (shown below sm) */}
          <div
            className="
              block sm:hidden border rounded-xl p-6 shadow-ph-dark mt-6 transition-colors duration-300
              bg-light-white border-light-mid
              dark:bg-dark-card dark:border-dark-border
            "
          >
            <span className="font-body font-semibold text-[10px] uppercase tracking-widest text-gold block">
              YOUR IMPACT
            </span>
            <div className="font-display font-bold text-[52px] leading-none text-light-charcoal dark:text-white mt-1">
              100%
            </div>
            <span className="font-body text-[13px] text-light-secondary dark:text-white/55 block mt-1">
              Goes directly to ministry
            </span>
          </div>
        </div>

        {/* Right Column — Impact text stack */}
        <div className="reveal reveal-delay-1">
          <span className="font-body font-semibold text-[11px] uppercase tracking-[0.18em] text-gold block">
            WHERE IT GOES
          </span>
          <div className="w-10 h-[2px] bg-gold mt-2 mb-6" />
          
          <h2
            className="
              font-display font-bold text-[36px] sm:text-[46px] leading-tight
              text-light-charcoal dark:text-white
            "
          >
            Your Gift <span className="font-display italic text-gold block sm:inline">Changes Lives.</span>
          </h2>
          
          <p
            className="
              font-body text-[16px] leading-[1.85] mt-5
              text-light-secondary dark:text-white/65
            "
          >
            Every dollar given to Amazing Grace Ministries MN goes directly toward building a community where people encounter God, find belonging, and discover their purpose.
          </p>

          {/* Impact Areas */}
          <div className="flex flex-col gap-5 mt-8">
            {areas.map((area, idx) => {
              const IconComponent = area.icon
              return (
                <div key={idx} className="flex items-start gap-4">
                  <div
                    className="
                      w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-300
                      bg-light-gray dark:bg-dark-elevated text-gold
                    "
                  >
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-body font-bold text-[15px] text-light-charcoal dark:text-white">
                      {area.title}
                    </h3>
                    <p className="font-body text-[13px] leading-relaxed mt-0.5 text-light-secondary dark:text-white/55">
                      {area.body}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </section>
  )
}

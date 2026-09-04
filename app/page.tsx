import AnnouncementBar from "@/components/AnnouncementBar";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import PullQuote from "@/components/layout/PullQuote";
import HomeHero from "@/components/home/HomeHero";
import StorySection from "@/components/home/StorySection";
import ServiceTimesBand from "@/components/home/ServiceTimesBand";
import SermonHighlight from "@/components/home/SermonHighlight";
import EventsRail from "@/components/home/EventsRail";
import GivingBand from "@/components/home/GivingBand";
import Reveal from "@/components/ui/Reveal";
import { getRecentSermons } from "@/lib/youtube";
import { site } from "@/lib/site";
import { env } from "@/lib/env";

const churchJsonLd = {
  "@context": "https://schema.org",
  "@type": "Church",
  name: "Amazing Grace Ministries MN",
  url: env.siteUrl(),
  telephone: site.contact.phone,
  email: site.contact.email,
  address: {
    "@type": "PostalAddress",
    streetAddress: site.address.street,
    addressLocality: site.address.city,
    addressRegion: site.address.state,
    postalCode: site.address.zip,
    addressCountry: "US",
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: "Sunday",
      opens: "09:00",
      closes: "11:30",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: "Wednesday",
      opens: "18:00",
      closes: "19:30",
    },
  ],
  sameAs: [site.socials.facebook, site.socials.instagram, site.socials.youtube],
};

export default async function Home() {
  const sermons = await getRecentSermons(4);
  return (
    <main className="flex min-h-screen flex-col bg-surface font-body text-text-primary antialiased">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(churchJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <Navbar />
      <AnnouncementBar />
      <HomeHero />
      <StorySection />
      <ServiceTimesBand />
      <SermonHighlight sermons={sermons} />
      <section aria-label="Our family" className="py-20 md:py-28">
        <Reveal>
          <PullQuote cite="Rooted in faith. Reaching the world.">
            &ldquo;We are the Amazing Family.&rdquo;
          </PullQuote>
        </Reveal>
      </section>
      <EventsRail />
      <GivingBand />
      <Footer />
    </main>
  );
}

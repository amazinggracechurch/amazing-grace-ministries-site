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
import { getFeaturedProject } from "@/lib/projects";
import { getSiteSettings } from "@/lib/site-settings";
import type { SiteSettings } from "@/lib/admin/site-settings";
import { env } from "@/lib/env";

function churchJsonLd(settings: SiteSettings) {
  return {
    "@context": "https://schema.org",
    "@type": "Church",
    name: "Amazing Grace Ministries MN",
    url: env.siteUrl(),
    telephone: settings.contact.phone,
    email: settings.contact.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: settings.address.street,
      addressLocality: settings.address.city,
      addressRegion: settings.address.state,
      postalCode: settings.address.zip,
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
    sameAs: [
      settings.socials.facebook,
      settings.socials.instagram,
      settings.socials.youtube,
    ],
  };
}

export default async function Home() {
  const settings = await getSiteSettings();
  const sermons = await getRecentSermons(4);
  // Featured campaign for the giving band — Firestore trouble must never
  // take the home page down, so a failure simply renders the generic band.
  const featuredProject = await getFeaturedProject().catch(() => null);
  return (
    <main className="flex min-h-screen flex-col bg-surface font-body text-text-primary antialiased">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(churchJsonLd(settings)).replace(/</g, "\\u003c"),
        }}
      />
      <Navbar />
      <AnnouncementBar />
      <HomeHero address={settings.address} youtubeUrl={settings.socials.youtube} />
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
      <GivingBand project={featuredProject} />
      <Footer />
    </main>
  );
}

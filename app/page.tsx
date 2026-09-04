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

export default async function Home() {
  const sermons = await getRecentSermons(4);
  return (
    <main className="flex min-h-screen flex-col bg-surface font-body text-text-primary antialiased">
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

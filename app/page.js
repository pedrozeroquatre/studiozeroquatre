import Hero from '@/components/home/Hero'
import Marquee from '@/components/home/Marquee'
import VoltaSection from '@/components/home/VoltaSection'
import ProcessSection from '@/components/home/ProcessSection'
import CtaSection from '@/components/home/CtaSection'

export default function HomePage() {
  return (
    <>
      <Hero />
      <VoltaSection />
      <Marquee />
      <ProcessSection />
      <CtaSection />
    </>
  )
}

import Contact from "../sections/contact/Contact";
import Hero from "../sections/hero/Hero";
import HowItHelps from "../sections/how-it-helps/HowItHelps";
import Marquee from "../sections/marquee/Marquee";
import Problem from "../sections/problem/Problem";
import Services from "../sections/services/Services";
import WhyUs from "../sections/why-us/WhyUs";

/**
 * The home page: the chapters in the order config/chapters.js lists them. Add a
 * chapter there first, then its section here.
 */
export default function HomePage() {
  return (
    <main>
      <Hero />
      <Marquee />
      <Problem />
      <Services />
      <WhyUs />
      <HowItHelps />
      <Contact />
    </main>
  );
}

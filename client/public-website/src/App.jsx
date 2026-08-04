import Contact from "./components/Contact";
import Footer from "./components/Footer";
import Header from "./components/Header";
import Hero from "./components/Hero";
import HowItHelps from "./components/HowItHelps";
import Marquee from "./components/Marquee";
import Services from "./components/Services";
import WhyUs from "./components/WhyUs";
import {
  BackToTop,
  CursorSpotlight,
  DotNav,
  ScrollProgress,
} from "./components/ui/PageChrome";

export default function App() {
  return (
    <>
      <a
        href="#home"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-full focus:bg-navy-800 focus:px-5 focus:py-2.5 focus:text-sm focus:font-bold focus:text-white"
      >
        Skip to content
      </a>
      <ScrollProgress />
      <CursorSpotlight />
      <Header />
      <main>
        <Hero />
        <Marquee />
        <Services />
        <WhyUs />
        <HowItHelps />
        <Contact />
      </main>
      <Footer />
      <DotNav />
      <BackToTop />
    </>
  );
}

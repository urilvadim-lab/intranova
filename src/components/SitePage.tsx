import About from "@/components/About";
import Contacts from "@/components/Contacts";
import Format from "@/components/Format";
import Faq from "@/components/Faq";
import FloatingContact from "@/components/FloatingContact";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Hero, { type HeroVisual } from "@/components/Hero";
import Methods from "@/components/Methods";
import Outcomes from "@/components/Outcomes";
import Prices from "@/components/Prices";
import Program from "@/components/Program";
import Signup from "@/components/Signup";
import Videos from "@/components/Videos";
import Why from "@/components/Why";

/** Вся страница интенсива; варианты отличаются образом первого экрана и цветовыми акцентами. */
export default function SitePage({ visual = "network", theme }: { visual?: HeroVisual; theme?: "v1" | "v2" }) {
  return (
    <div className={theme ? `theme-${theme}` : undefined}>
      <Header />
      <main>
        <Hero visual={visual} />
        <About />
        <Format />
        <Methods />
        <Why />
        <Videos />
        <Program />
        <Outcomes />
        <Prices />
        <Signup />
        <Faq />
        <Contacts />
      </main>
      <Footer />
      <FloatingContact />
    </div>
  );
}

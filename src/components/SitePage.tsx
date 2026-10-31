import About from "@/components/About";
import Audience from "@/components/Audience";
import Format from "@/components/Format";
import Faq from "@/components/Faq";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Hero, { type HeroVisual } from "@/components/Hero";
import Methods from "@/components/Methods";
import Prices from "@/components/Prices";
import Program from "@/components/Program";
import Signup from "@/components/Signup";
import Speakers from "@/components/Speakers";
import Videos from "@/components/Videos";

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
        <Audience />
        <Program />
        <Speakers />
        <Videos />
        <Prices />
        <Signup />
        <Faq />
      </main>
      <Footer />
    </div>
  );
}

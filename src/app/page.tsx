import About from "@/components/About";
import Faq from "@/components/Faq";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Methods from "@/components/Methods";
import Prices from "@/components/Prices";
import Program from "@/components/Program";
import Signup from "@/components/Signup";
import Speakers from "@/components/Speakers";
import Videos from "@/components/Videos";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <About />
        <Methods />
        <Program />
        <Speakers />
        <Videos />
        <Prices />
        <Signup />
        <Faq />
      </main>
      <Footer />
    </>
  );
}

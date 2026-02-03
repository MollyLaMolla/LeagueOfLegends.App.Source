import { useEffect } from "react";
import Hero from "./components/Hero";
import About from "./components/About";
import Navbar from "./components/Navbar";
import Features from "./components/Features";
import Story from "./components/Story";
import Contact from "./components/Contact";
import Footer from "./components/Footerz";

const App = () => {
  useEffect(() => {
    // Disabilita ripristino automatico del browser (Safari/Chrome back-forward cache)
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }

    const hasHash = typeof window !== "undefined" && window.location.hash;
    const userHasScrolledRef = { current: false };
    const onUserScroll = () => {
      if ((window.scrollY || 0) > 4) userHasScrolledRef.current = true;
    };
    window.addEventListener("scroll", onUserScroll, { passive: true });

    // Esegui scrollTo top SOLO se: niente hash, utente non ha scrollato, prima load
    const jumpToTopIfNeeded = (why) => {
      if (hasHash) return; // lasciamo il browser andare alla sezione ancorata
      if (userHasScrolledRef.current) return; // l'utente ha iniziato a scrollare → non forzare
      if (!sessionStorage.getItem("pageInitialScrollDone")) {
        sessionStorage.setItem("pageInitialScrollDone", "true");
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      }
    };

    // Subito (prime microtask)
    requestAnimationFrame(() => jumpToTopIfNeeded("init"));

    // Quando la pagina segnala load completo
    const handleLoad = () => jumpToTopIfNeeded("load");
    window.addEventListener("load", handleLoad);

    // Debug opzionale: log tutte le chiamate a scrollTo (solo in dev)
    if (import.meta.env.DEV) {
      try {
        const original = window.scrollTo;
        if (!window.__SCROLL_TO_DEBUGGED__) {
          window.__SCROLL_TO_DEBUGGED__ = true;
          window.scrollTo = function (...args) {
            // Ignora le nostre chiamate 'instant' iniziali
            // eslint-disable-next-line no-console
            console.debug(
              "[scrollTo debug]",
              args,
              new Error().stack.split("\n").slice(1, 4).join("\n"),
            );
            return original.apply(this, args);
          };
        }
      } catch (e) {
        // fail silently
      }
    }

    return () => {
      window.removeEventListener("load", handleLoad);
      window.removeEventListener("scroll", onUserScroll);
    };
  }, []);

  return (
    <main className="relative min-h-screen w-screen overflow-x-hidden">
      <Navbar />
      <Hero />
      <About />
      <Features />
      <Story />
      <Contact />
      <Footer />
    </main>
  );
};

export default App;

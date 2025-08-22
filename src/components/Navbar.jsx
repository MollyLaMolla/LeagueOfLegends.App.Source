import { useEffect, useRef, useState } from "react";
import { TiLocationArrow } from "react-icons/ti";
import { FaBars, FaTimes } from "react-icons/fa";
import Button from "./Button";
import gsap from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";

gsap.registerPlugin(ScrollToPlugin);

const navItems = ["About", "Rift", "Features", "Story", "Contact"];

const Navbar = () => {
  const navContainerRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const [isTheNavbarOnTheTop, setIsTheNavbarOnTheTop] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isTheNavbarScrolling, setIsTheNavbarScrolling] = useState(false);
  const [isTheNavbarHovered, setIsTheNavbarHovered] = useState(false);
  const [afterScroll, setAfterScroll] = useState(false);
  const [lastScrollDirection, setLastScrollDirection] = useState(null);
  const isTouchDevice = useRef(
    "ontouchstart" in window || navigator.maxTouchPoints > 0
  );
  const animationRef = useRef(null);

  // rAF-throttled scroll handler to avoid too-frequent state updates
  useEffect(() => {
    if (!navContainerRef.current) return;

    const lastScrollRef = { current: window.scrollY || 0 };
    let ticking = false;

    const onScroll = () => {
      setAfterScroll(false);
      const y = window.scrollY || 0;
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        if (!navContainerRef.current) {
          ticking = false;
          return;
        }

        if (y === 0) {
          setIsNavVisible(true);
          setIsTheNavbarOnTheTop(true);
          setLastScrollDirection(null);
          navContainerRef.current.classList.remove("floating-nav");
        } else if (y > lastScrollRef.current) {
          // scrolling down
          setIsNavVisible(false);
          setIsTheNavbarOnTheTop(false);
          setLastScrollDirection("down");
          navContainerRef.current.classList.add("floating-nav");
        } else if (y < lastScrollRef.current) {
          // scrolling up
          setIsNavVisible(true);
          setIsTheNavbarOnTheTop(false);
          setLastScrollDirection("up");
          navContainerRef.current.classList.add("floating-nav");
        }

        lastScrollRef.current = y;
        setLastScrollY(y);
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    if (
      afterScroll &&
      !isTheNavbarHovered &&
      !isTheNavbarScrolling &&
      !isTheNavbarOnTheTop
    ) {
      gsap.to(navContainerRef.current, {
        y: -100,
        opacity: 0,
        duration: 0.1,
      });
      setAfterScroll(false);
      setIsNavVisible(false);
    } else if (afterScroll && isTheNavbarHovered) {
      setIsNavVisible(true);
    } else if (!afterScroll && isTheNavbarOnTheTop) {
      setIsNavVisible(true);
    } else if (
      !afterScroll &&
      !isTheNavbarOnTheTop &&
      !isTheNavbarHovered &&
      lastScrollDirection === "down"
    ) {
      setIsNavVisible(false);
      gsap.to(navContainerRef.current, {
        y: -100,
        opacity: 0,
        duration: 0.1,
      });
    }
  }, [afterScroll, isTheNavbarHovered, lastScrollY]);

  // Animazione per la navbar
  useEffect(() => {
    if (animationRef.current) {
      animationRef.current.kill();
    }

    if ((isTheNavbarScrolling || isTheNavbarHovered) && !isTouchDevice.current)
      return;
    animationRef.current = gsap.to(navContainerRef.current, {
      y: isNavVisible ? 0 : -100,
      opacity: isNavVisible ? 1 : 0,
      duration: 0.1,
    });
  }, [isNavVisible]);

  // Funzione per lo scroll fluido verso le sezioni
  const handleSmoothScroll = (e, targetId) => {
    e.preventDefault();

    // Chiudi il menu mobile se aperto
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }

    const targetElement = document.getElementById(targetId);

    if (targetElement) {
      // Calcola la posizione dell'elemento target
      const targetPosition =
        targetElement.getBoundingClientRect().top + window.scrollY;
      const startPosition = window.scrollY;
      const distance = targetPosition - startPosition;
      let dinamicDuration = Math.round(Math.abs(distance) / 300) / 10; // Durata dinamica in base alla distanza
      if (dinamicDuration < 0.5) dinamicDuration = 0.5; // Imposta un minimo di 0.5 secondi

      // Notify other components that a programmatic smooth-scroll is starting
      try {
        window.dispatchEvent(new Event("smoothScrollStart"));
      } catch (e) {
        /* ignore */
      }

      // Anima lo scroll con GSAP
      gsap.to(window, {
        scrollTo: {
          y: targetPosition,
          autoKill: false,
        },
        duration: dinamicDuration, // Durata dell'animazione in secondi
        ease: "power2.inOut", // Tipo di easing per un'animazione fluida
        onStart: () => {
          setIsTheNavbarScrolling(true);
        },
        onComplete: () => {
          try {
            window.dispatchEvent(new Event("smoothScrollEnd"));
            setIsTheNavbarScrolling(false);
            setAfterScroll(true);
          } catch (e) {
            /* ignore */
          }
        },
      });
    }
  };

  // Funzione per aprire/chiudere il menu mobile
  const toggleMobileMenu = () => {
    if (!isMobileMenuOpen && mobileMenuRef.current) {
      mobileMenuRef.current.style.display = "flex";
    }
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Aggiungi questo useEffect per gestire l'apertura e chiusura del menu mobile
  useEffect(() => {
    if (!mobileMenuRef.current) return;

    if (isMobileMenuOpen) {
      // Mostra il menu mobile e blocca lo scroll del body
      mobileMenuRef.current.style.display = "flex";
      document.body.style.overflow = "hidden";

      // Anima l'apertura
      gsap.to(mobileMenuRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.3,
        ease: "power2.out",
      });
    } else {
      // Anima la chiusura e poi nasconde il menu
      gsap.to(mobileMenuRef.current, {
        opacity: 0,
        y: -20,
        duration: 0.2,
        ease: "power2.in",
        onComplete: () => {
          if (mobileMenuRef.current) {
            mobileMenuRef.current.style.display = "none";
            document.body.style.overflow = ""; // Ripristina lo scroll
          }
        },
      });
    }

    return () => {
      // Cleanup: ripristina lo scroll quando il componente viene smontato
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]); // Questo effect si attiva quando cambia isMobileMenuOpen

  const handleProductClick = () => {
    // prevent default and open in a new tab
    window.open("https://www.leagueoflegends.com/en-us/news/merch/", "_blank");
  };

  return (
    <>
      <div
        ref={navContainerRef}
        className="fixed inset-x-2 top-2 z-999 h-16 border-none transition-all duration-700 sm:top-4 sm:inset-x-4"
        onMouseEnter={() => setIsTheNavbarHovered(true)}
        onMouseLeave={() => setIsTheNavbarHovered(false)}
      >
        <header className="absolute top-1/2 w-full -translate-y-1/2">
          <nav className="flex size-full items-center justify-between p-4">
            <div className="flex items-center gap-7">
              <a href="#hero" onClick={(e) => handleSmoothScroll(e, "hero")}>
                <img src="./images/logo.webp" alt="Logo" className="w-10" />
              </a>
              <a className="rounded-full" onClick={handleProductClick}>
                <Button
                  id="product-button"
                  title="Product"
                  rightIcon={<TiLocationArrow />}
                  containerClass="bg-league-of-legends-gold-400! lg:flex hidden items-center justify-center gap-1 hover:bg-league-of-legends-gold-400/80!"
                />
              </a>
            </div>
            <div className="flex h-full items-center justify-center">
              {/* Menu desktop */}
              <div className="hidden lg:flex items-center gap-[2.5rem]">
                {navItems.map((item) => (
                  <a
                    key={item}
                    href={`#${item.toLowerCase()}`}
                    className="nav-hover-btn"
                    onClick={(e) => handleSmoothScroll(e, item.toLowerCase())}
                  >
                    {item}
                  </a>
                ))}
              </div>

              {/* Pulsante hamburger per mobile */}
              <button
                onClick={toggleMobileMenu}
                className="lg:hidden flex items-center justify-center text-white p-2 rounded-full bg-league-of-legends-gold-400 hover:bg-league-of-legends-gold-400/80"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? (
                  <FaTimes size={20} />
                ) : (
                  <FaBars size={20} />
                )}
              </button>
            </div>
          </nav>
        </header>
      </div>

      {/* Menu mobile a tendina */}
      <div
        ref={mobileMenuRef}
        className="fixed inset-0 z-40 bg-black/95 flex-col items-center justify-center pt-24 hidden"
        style={{ opacity: 0 }}
      >
        <div className="flex flex-col items-center gap-6 w-full px-8 overflow-auto pb-8">
          {navItems.map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="text-white text-2xl font-bold transition-colors hover:text-league-of-legends-gold-400 w-full text-center py-4 border-b border-white/10"
              onClick={(e) => handleSmoothScroll(e, item.toLowerCase())}
            >
              {item}
            </a>
          ))}
          <a
            href="https://www.leagueoflegends.com/en-us/news/merch/"
            className="rounded-full w-full h-fit mt-4"
          >
            <Button
              id="product-button-mobile"
              title="Product"
              rightIcon={<TiLocationArrow />}
              containerClass="bg-league-of-legends-gold-400! flex items-center justify-center gap-1 hover:bg-league-of-legends-gold-400/80 w-full py-6"
              onClick={() => setIsMobileMenuOpen(false)}
            />
          </a>
        </div>
      </div>
    </>
  );
};

export default Navbar;

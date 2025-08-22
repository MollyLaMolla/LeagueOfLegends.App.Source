import { TiLocationArrow } from "react-icons/ti";
import { useRef, useEffect, useState } from "react";
import LazyVideo from "./LazyVideo";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const BentoTilt = ({ children, className = "", cardId, index }) => {
  const transformStyleRef = useRef("");
  const itemRef = useRef();

  // Animazione all'entrata della card (simile a AnimatedTitle)
  useEffect(() => {
    if (!itemRef.current) return;

    // Determina la posizione della card
    let initialRotationY = 0;
    if (index === 0) {
      // Card centrale
      initialRotationY = 0;
    } else if (index === 1 || index === 4) {
      // Card a sinistra
      initialRotationY = 10;
    } else if (index === 2 || index === 3 || index === 5) {
      // Card a destra
      initialRotationY = -10;
    }

    // Imposta lo stato iniziale della card
    gsap.set(itemRef.current, {
      // Imposta le proprietà iniziali per l'animazione
      // se la card è al centro rotationY: 0, se è a sinistra rotationY: 10, se è a destra rotationY: -10
      opacity: 0,
      scale: 0.97,
      rotationX: -45,
      rotationY: initialRotationY, // Usa il valore calcolato
      y: 20,
    });

    // Crea l'animazione di entrata
    const cardAnimation = gsap.timeline({
      scrollTrigger: {
        trigger: itemRef.current,
        start: "top bottom -=10",
        end: "center bottom",
        toggleActions: "play none none reverse",
      },
    });

    cardAnimation.to(itemRef.current, {
      opacity: 1,
      scale: 1,
      rotationX: 0,
      rotationY: 0, // Tutte le card finiscono con rotationY: 0
      y: 0,
      duration: 0.75,
      ease: "power2.out",
    });

    return () => {
      // Cleanup
      if (cardAnimation.scrollTrigger) {
        cardAnimation.scrollTrigger.kill();
      }
    };
  }, [index]);

  const handleMouseMove = (e) => {
    if (!itemRef.current) return;
    const rect = itemRef.current.getBoundingClientRect();

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const deltaX = x - centerX;
    const deltaY = y - centerY;

    // Imposta fattori di tilt diversi per ciascuna card
    let tiltFactorX, tiltFactorY, scale;

    if (cardId === "feature-main") {
      tiltFactorX = 3;
      tiltFactorY = -3;
      scale = 0.98;
    } else if (cardId === "feature-champions") {
      tiltFactorX = 5;
      tiltFactorY = -5;
      scale = 0.97;
    } else {
      tiltFactorX = 8;
      tiltFactorY = -8;
      scale = 0.96;
    }

    const tiltX = (deltaY / centerY) * tiltFactorX;
    const tiltY = (deltaX / centerX) * tiltFactorY;

    // Apply transform directly to the DOM node to avoid frequent React re-renders
    transformStyleRef.current = `perspective(800px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(${scale}, ${scale}, ${scale})`;
    if (itemRef.current) {
      itemRef.current.style.transform = transformStyleRef.current;
    }
  };

  const handleMouseLeave = () => {
    transformStyleRef.current = "";
    if (itemRef.current) {
      itemRef.current.style.transform = "";
    }
  };

  return (
    <div
      className={className}
      ref={itemRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      data-card-id={cardId}
    >
      {children}
    </div>
  );
};

const BentoCard = ({ src, title, description, blurred }) => {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [removeOverlay, setRemoveOverlay] = useState(false);
  const prevScrollRef = useRef(0);
  const programmaticRef = useRef(false);

  // Track programmatic smooth scroll (from Navbar) so we don't treat legit jumps as glitches
  useEffect(() => {
    const onStart = () => (programmaticRef.current = true);
    const onEnd = () => (programmaticRef.current = false);
    const onScroll = () => {
      if (!ready) prevScrollRef.current = window.scrollY || 0;
    };
    window.addEventListener("smoothScrollStart", onStart);
    window.addEventListener("smoothScrollEnd", onEnd);
    window.addEventListener("scroll", onScroll, { passive: true });
    // inizializza
    prevScrollRef.current = window.scrollY || 0;
    return () => {
      window.removeEventListener("smoothScrollStart", onStart);
      window.removeEventListener("smoothScrollEnd", onEnd);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const guardScrollJump = () => {
    // Eseguito dopo il load del video per ripristinare eventuale salto involontario
    const before = prevScrollRef.current;
    requestAnimationFrame(() => {
      const now = window.scrollY || 0;
      if (
        !programmaticRef.current &&
        before > 300 &&
        now < before - 150 &&
        now < 100
      ) {
        // Ripristina
        window.scrollTo({ top: before, behavior: "instant" });
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.debug(
            "[JumpGuard] Ripristino scroll da",
            now,
            "a",
            before,
            "(BentoCard)"
          );
        }
      }
    });
  };

  // Avvia il fade-out quando ready diventa true
  useEffect(() => {
    if (ready) {
      const t = setTimeout(() => setRemoveOverlay(true), 550); // dopo la transizione
      return () => clearTimeout(t);
    }
  }, [ready]);

  return (
    <div className="relative size-full">
      {!removeOverlay && (
        <div
          className={`absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity duration-500 ease-out pointer-events-none ${
            ready ? "opacity-0" : "opacity-100"
          }`}
        >
          <div className="three-body scale-50 opacity-80">
            <div className="three-body__dot" />
            <div className="three-body__dot" />
            <div className="three-body__dot" />
          </div>
        </div>
      )}
      {failed && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 text-white text-xs font-family-circular-web p-2 text-center">
          Video non disponibile
        </div>
      )}
      <LazyVideo
        src={src}
        loop
        muted
        autoPlay
        playsInline
        preload="metadata"
        className="absolute left-0 top-0 size-full object-cover object-center"
        onLoadedData={() => {
          setReady(true);
          guardScrollJump();
        }}
        onError={() => {
          setFailed(true);
          setReady(true);
          guardScrollJump();
        }}
      />
      <div className="relative z-10 flex size-full flex-col justify-between p-5 text-white-50">
        <div>
          <h1 className={`bento-title special-font`}>{title}</h1>
          {description && (
            <p
              className={`mt-3 max-w-64 text-xs md:text-base ${
                blurred ? "blurred" : ""
              }`}
            >
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const Features = () => {
  return (
    <section className="bg-black pb-52 flex justify-center items-center relative">
      <div id="rift" className="rift-position"></div>
      <div className="container mx-0 px-2">
        <div className="px-5 py-32">
          <p className="font-family-circular-web text-lg text-white-50">
            Into the Rift
          </p>
          <p className="max-w-md font-family-circular-web text-lg text-white-50 opacity-50">
            Step into a mythic realm where champions rise, factions clash, and
            every battle echoes across a living legend.
          </p>
        </div>
        <BentoTilt
          className="fluid-tilt border-hsla relative mb-7 h-96 w-full overflow-hidden rounded-md md:h-[65vh]"
          cardId="feature-main"
          index={0}
        >
          <BentoCard
            src="./videos/feature-1.webm"
            title={
              <>
                Ri<b>f</b>t
              </>
            }
            description="Enter a world where the boundaries of reality blur, and the extraordinary becomes the norm."
          />
        </BentoTilt>
        <div className="grid h-[135vh] grid-cols-2 grid-rows-3 gap-7 relative">
          <div id="features" className="features-position"></div>
          <BentoTilt
            className="bento-tilt_1 row-span-1 md:col-span-1 md:row-span-2"
            cardId="feature-champions"
            index={1}
          >
            <BentoCard
              src="./videos/feature-2.webm"
              title={
                <>
                  cha<b>m</b>pio<b>n</b>s
                </>
              }
              description="
                Pick a champion and step beyond the veil—171 legends await, from stealthy Assassins to resilient Tanks, each forged for a unique tactical role."
              blurred
            />
          </BentoTilt>
          <BentoTilt
            className="bento-tilt_1 row-span-1 ms-32 md:col-span-1 md:ms-0"
            cardId="feature-overview"
            index={2}
          >
            <BentoCard
              src="./videos/feature-3.webm"
              title={
                <>
                  O<b>ve</b>rview
                </>
              }
              description="
                League of Legends is a competitive MOBA where strategy, skill, and teamwork come together. Pick your champion, control the map, and climb the ranks!"
              blurred
            />
          </BentoTilt>
          <BentoTilt
            className="bento-tilt_1 me-14 md:col-span-1 md:me-0"
            cardId="feature-role-mastery"
            index={3}
          >
            <BentoCard
              src="./videos/feature-4.webm"
              title={
                <>
                  R<b>o</b>le Mas<b>t</b>ery
                </>
              }
              description="
                Master your lane, understand your teammates, and elevate your gameplay. Great teams begin with great roles."
              blurred
            />
          </BentoTilt>
          <BentoTilt
            className="bento-tilt_2"
            cardId="feature-coming-soon"
            index={4}
          >
            <div className="flex size-full flex-col justify-between bg-league-of-legends-blue-400 p-5 text-black">
              <h1 className="bento-title special-font max-w-64">
                M<b>o</b>re <br /> co<b>m</b>ing <br />
                so<b>o</b>n!
              </h1>
              <TiLocationArrow className="m-5 scale-[5] self-end" />
            </div>
          </BentoTilt>
          <BentoTilt className="bento-tilt_2" cardId="feature-video" index={5}>
            {/* Loader dedicato per feature-5 (solo video) */}
            <FeatureFiveVideo />
          </BentoTilt>
        </div>
      </div>
    </section>
  );
};

// Componente specifico per feature-5 con overlay di caricamento e fallback errore
const FeatureFiveVideo = () => {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [removeOverlay, setRemoveOverlay] = useState(false);
  const prevScrollRef = useRef(0);
  const programmaticRef = useRef(false);

  useEffect(() => {
    const onStart = () => (programmaticRef.current = true);
    const onEnd = () => (programmaticRef.current = false);
    const onScroll = () => {
      if (!ready) prevScrollRef.current = window.scrollY || 0;
    };
    window.addEventListener("smoothScrollStart", onStart);
    window.addEventListener("smoothScrollEnd", onEnd);
    window.addEventListener("scroll", onScroll, { passive: true });
    prevScrollRef.current = window.scrollY || 0;
    return () => {
      window.removeEventListener("smoothScrollStart", onStart);
      window.removeEventListener("smoothScrollEnd", onEnd);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const guardScrollJump = () => {
    const before = prevScrollRef.current;
    requestAnimationFrame(() => {
      const now = window.scrollY || 0;
      if (
        !programmaticRef.current &&
        before > 300 &&
        now < before - 150 &&
        now < 100
      ) {
        window.scrollTo({ top: before, behavior: "instant" });
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.debug(
            "[JumpGuard] Ripristino scroll da",
            now,
            "a",
            before,
            "(FeatureFive)"
          );
        }
      }
    });
  };

  useEffect(() => {
    if (ready) {
      const t = setTimeout(() => setRemoveOverlay(true), 550);
      return () => clearTimeout(t);
    }
  }, [ready]);

  return (
    <div className="relative size-full">
      {!removeOverlay && (
        <div
          className={`absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity duration-500 ease-out pointer-events-none ${
            ready ? "opacity-0" : "opacity-100"
          }`}
        >
          <div className="three-body scale-50 opacity-80">
            <div className="three-body__dot" />
            <div className="three-body__dot" />
            <div className="three-body__dot" />
          </div>
        </div>
      )}
      {failed && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 text-white text-xs font-family-circular-web p-2 text-center">
          Video non disponibile
        </div>
      )}
      <LazyVideo
        src="./videos/feature-5.webm"
        loop
        muted
        autoPlay
        playsInline
        preload="metadata"
        className="size-full object-cover object-center"
        onLoadedData={() => {
          setReady(true);
          guardScrollJump();
        }}
        onError={() => {
          setFailed(true);
          setReady(true);
          guardScrollJump();
        }}
      />
    </div>
  );
};

export default Features;

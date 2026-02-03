import React, { useRef, useState, useEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import ScrollTrigger from "gsap/ScrollTrigger";
import AnimatedTitle from "./AnimatedTitle";

gsap.registerPlugin(ScrollTrigger);

const About = () => {
  const maskRef = useRef(null);
  const textContainerRef = useRef(null);
  const [isClipAnimationComplete, setIsClipAnimationComplete] = useState(false);
  const scrollTriggerRef = useRef(null);
  const particlesRef = useRef(null);

  useGSAP(() => {
    // Crea l'animazione principale
    const clipAnimation = gsap.timeline({
      scrollTrigger: {
        trigger: "#clip",
        start: "center center",
        end: "+=1600 center",
        scrub: 0.5,
        pin: true,
        pinSpacing: true,
        onUpdate: (self) => {
          scrollTriggerRef.current = self;
          const isComplete = self.progress >= 0.95;
          setIsClipAnimationComplete(isComplete);
        },
      },
    });

    // Imposta i valori iniziali basati sulla viewport
    const isMobile = window.innerWidth < 768;

    // Animazione iniziale più drammatica
    gsap.set(".mask-clip-path", {
      // Mantiene il centraggio senza usare translateX in CSS
      xPercent: -50,
      left: "50%",
      height: "60dvh",
      borderRadius: "1.5rem",
      rotationX: -10,
      rotationY: -25,
      rotationZ: -2,
      border: "3px solid rgba(0, 0, 0, 0.8)",
      boxShadow: "0 20px 50px rgba(0, 0, 0, 0.4)",
    });

    // Aggiungi step intermedio per un'animazione più ricca
    clipAnimation
      .to(".mask-clip-path", {
        width: isMobile ? "95dvw" : "60dvw",
        height: "75dvh",
        rotationX: -5,
        rotationY: -10,
        rotationZ: -1,
        borderRadius: "1rem",
        border: "2px solid rgba(0, 0, 0, 0.6)",
        boxShadow: "0 30px 70px rgba(0, 0, 0, 0.3)",
        duration: 0.4,
      })
      .to(".mask-clip-path", {
        width: "100dvw",
        height: "100dvh",
        borderRadius: 0,
        rotationX: 0,
        rotationY: 0,
        rotationZ: 0,
        border: "0px solid rgba(0, 0, 0, 0)",
        boxShadow: "none",
        duration: 0.6,
      });

    // Anima il testo per farlo scomparire durante lo scroll
    if (textContainerRef.current) {
      clipAnimation.fromTo(
        textContainerRef.current,
        { opacity: 1, y: 0 },
        { opacity: 0, y: 30, duration: 0.3 },
        0,
      );
    }
  });

  // Crea e anima particelle
  useEffect(() => {
    if (!particlesRef.current) return;

    // Crea particelle solo se non sono già state create
    if (particlesRef.current.children.length === 0) {
      const numParticles = 20;

      for (let i = 0; i < numParticles; i++) {
        const particle = document.createElement("div");
        particle.className = "particle";
        particle.style.cssText = `
          position: absolute;
          width: ${Math.random() * 4 + 2}px;
          height: ${Math.random() * 4 + 2}px;
          background: rgba(255, 255, 255, ${Math.random() * 0.4 + 0.1});
          border-radius: 50%;
          pointer-events: none;
          left: ${Math.random() * 100}%;
          top: ${Math.random() * 100}%;
          opacity: 0;
        `;
        particlesRef.current.appendChild(particle);

        // Anima ciascuna particella individualmente
        gsap.to(particle, {
          x: `random(-100, 100)`,
          y: `random(-100, 100)`,
          opacity: `random(0.2, 0.6)`,
          duration: `random(3, 7)`,
          delay: `random(0, 3)`,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }
    }
  }, []);

  // Gestione effetto tilt
  React.useEffect(() => {
    // Verifica se è un dispositivo touch/mobile
    const isTouchDevice = () => {
      return (
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0 ||
        navigator.msMaxTouchPoints > 0
      );
    };

    // Se è un dispositivo touch, disabilita completamente l'effetto tilt
    const isTouch =
      isTouchDevice() || window.matchMedia("(hover: none)").matches;

    // Se è un dispositivo mobile, imposta subito l'immagine normale senza tilt
    if (isTouch) {
      const clipContainer = maskRef.current;
      if (clipContainer) {
        gsap.set(clipContainer, {
          rotationX: 0,
          rotationY: 0,
          rotationZ: 0,
          transformPerspective: 1000,
        });

        const imageEl = clipContainer.querySelector("img");
        if (imageEl) {
          gsap.set(imageEl, {
            x: 0,
            y: 0,
            scale: 1,
          });
        }

        const overlayEl = clipContainer.querySelector(".image-overlay");
        if (overlayEl) {
          gsap.set(overlayEl, {
            opacity: 0,
          });
        }
      }

      // Esci dall'effetto senza aggiungere event listener o animation frames
      return;
    }

    let frameId;
    let mouseX = 0,
      mouseY = 0;
    let currentRotateX = 0,
      currentRotateY = 0;

    // Contenitore per l'effetto clip-path
    const clipContainer = maskRef.current;
    if (!clipContainer) return;

    // Immagine interna
    const imageEl = clipContainer.querySelector("img");
    const overlayEl = clipContainer.querySelector(".image-overlay");

    // Setup iniziale
    clipContainer.style.overflow = "hidden";

    // Inizializza lo stato in base all'animazione
    if (imageEl) {
      if (isClipAnimationComplete) {
        gsap.set(clipContainer, {
          rotationX: 0,
          rotationY: 0,
          rotationZ: 0,
        });

        gsap.set(imageEl, {
          x: 0,
          y: 0,
          scale: 1,
        });

        if (overlayEl) {
          gsap.set(overlayEl, {
            opacity: 0,
          });
        }
      } else {
        gsap.set(imageEl, {
          scale: 1.15,
        });

        if (overlayEl) {
          gsap.set(overlayEl, {
            opacity: 0.2,
          });
        }
      }
    }

    const animateTilt = () => {
      if (!clipContainer) return;

      // Ottieni il progresso attuale dell'animazione
      const progress = scrollTriggerRef.current?.progress || 0;

      // Calcola un fattore di riduzione in base al progresso
      // Inizia a ridurre il tilt quando il progresso supera 0.6
      // Il tilt diventa 0 quando il progresso raggiunge 0.95
      let tiltReductionFactor;
      if (progress > 0.6 && progress < 0.7) {
        tiltReductionFactor = Math.max(0, 1 - (progress - 0.6) / 0.35);
      } else if (progress >= 0.7 && progress < 0.9) {
        tiltReductionFactor = 0.2;
      } else if (progress >= 0.9) {
        tiltReductionFactor = 0;
      } else {
        tiltReductionFactor = 1;
      }

      if (isClipAnimationComplete) {
        // Reset quando l'animazione è completata
        if (currentRotateX !== 0 || currentRotateY !== 0) {
          currentRotateX = 0;
          currentRotateY = 0;

          gsap.set(clipContainer, {
            rotationX: 0,
            rotationY: 0,
            rotationZ: 0,
          });

          if (imageEl) {
            gsap.set(imageEl, {
              x: 0,
              y: 0,
              scale: 1,
            });
          }

          if (overlayEl) {
            gsap.set(overlayEl, {
              opacity: 0,
              background:
                "radial-gradient(circle at 50% 50%, rgba(255,255,255,0), rgba(0,0,0,0))",
            });
          }

          if (particlesRef.current) {
            gsap.to(particlesRef.current.children, {
              opacity: 0,
              duration: 0.5,
            });
          }
        }
      } else {
        // Applica il tilt con intensità ridotta man mano che l'animazione avanza
        const rect = clipContainer.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const deltaX = (mouseX - centerX) / (window.innerWidth * 0.5);
        const deltaY = (mouseY - centerY) / (window.innerHeight * 0.5);

        const maxTilt = window.innerWidth < 768 ? 2.5 : 5;

        // Applica il fattore di riduzione al tilt massimo
        const adjustedMaxTilt = maxTilt * tiltReductionFactor;

        const targetRotateX = Math.max(
          Math.min(deltaY * adjustedMaxTilt, adjustedMaxTilt),
          -adjustedMaxTilt,
        );
        const targetRotateY = Math.max(
          Math.min(-deltaX * adjustedMaxTilt, adjustedMaxTilt),
          -adjustedMaxTilt,
        );

        const easing = 0.08;
        currentRotateX += (targetRotateX - currentRotateX) * easing;
        currentRotateY += (targetRotateY - currentRotateY) * easing;

        gsap.set(clipContainer, {
          rotationX: currentRotateX,
          rotationY: currentRotateY,
          rotationZ: 0,
          transformPerspective: 1000,
          transformOrigin: "center center",
          transformStyle: "preserve-3d",
        });

        // Adatta anche il movimento dell'immagine
        if (imageEl) {
          gsap.set(imageEl, {
            x: currentRotateY * 7 * tiltReductionFactor,
            y: currentRotateX * 7 * tiltReductionFactor,
            // Riduci gradualmente la scala verso 1 quando il progresso aumenta
            scale: 1 + 0.15 * tiltReductionFactor,
          });
        }

        // Adatta anche l'intensità dell'overlay e delle particelle
        if (overlayEl) {
          const lightX = 50 + deltaX * 30 * tiltReductionFactor;
          const lightY = 50 + deltaY * 30 * tiltReductionFactor;
          const intensity =
            (Math.sqrt(deltaX * deltaX + deltaY * deltaY) * 0.3 + 0.1) *
            tiltReductionFactor;

          gsap.set(overlayEl, {
            opacity: intensity,
            background: `radial-gradient(circle at ${lightX}% ${lightY}%, rgba(255,255,255,0.15), rgba(0,0,0,0.15))`,
          });
        }

        // Riduci anche l'opacità e il movimento delle particelle
        if (particlesRef.current && particlesRef.current.children.length > 0) {
          const moveIntensity =
            Math.sqrt(deltaX * deltaX + deltaY * deltaY) *
            2 *
            tiltReductionFactor;

          gsap.to(particlesRef.current.children, {
            x: `+=${-deltaX * 20 * tiltReductionFactor}`,
            y: `+=${-deltaY * 20 * tiltReductionFactor}`,
            opacity: (0.1 + moveIntensity * 0.3) * tiltReductionFactor,
            duration: 0.5,
            overwrite: "auto",
          });
        }
      }

      frameId = requestAnimationFrame(animateTilt);
    };

    const handleMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    window.addEventListener("mousemove", handleMouseMove);
    frameId = requestAnimationFrame(animateTilt);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(frameId);
    };
  }, [isClipAnimationComplete]);

  return (
    <div id="about" className="min-h-screen w-screen">
      <div className="relative mb-8 mt-36 flex flex-col items-center gap-5">
        <h2 className="font-family-general text-sm uppercase md:text-[10px]">
          Welcome To League of Legends
        </h2>
        <AnimatedTitle
          title={
            "St<b>e</b>p i<b>n</b>to <b>t</b>he Ri<b>f</b>t <br /> a<b>nd</b> <br /> s<b>h</b>ape y<b>o</b>ur leg<b>a</b>cy"
          }
          containerClass="text-center !text-league-of-legends-gold-400 mt-5"
        />
      </div>
      <div className="h-dvh w-screen relative" id="clip">
        <div
          className="mask-clip-path about-image"
          ref={maskRef}
          style={{
            overflow: "hidden",
            transformStyle: "preserve-3d",
            perspective: "1000px",
            backdropFilter: "blur(0px)",
            transition: "backdrop-filter 0.5s ease",
          }}>
          {/* Overlay per effetti di luce */}
          <div
            className="image-overlay absolute left-0 top-0 size-full z-10 pointer-events-none"
            style={{ opacity: 0.2 }}></div>

          {/* Contenitore per le particelle */}
          <div
            ref={particlesRef}
            className="particle-container absolute left-0 top-0 size-full z-20 pointer-events-none overflow-hidden"></div>

          {/* Immagine principale */}
          <img
            src="./images/about.webp"
            alt="Background"
            className="absolute left-0 top-0 size-full object-cover"
          />
        </div>
        <div className="about-subtext" ref={textContainerRef}>
          <p className="lighter-black text-xl mb-2 font-family-robert-regular">
            Step into the Rift, where champions clash and legends are born
          </p>
          <p className="lighter-black-text max-w-xl text-white-50/80 font-family-robert-regular text-lg">
            Your journey begins in the ultimate 5v5 arena—master your role,
            forge your path, and rise to greatness.
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;

import { useRef, useState, useEffect, useCallback } from "react";
import AnimatedTitle from "./AnimatedTitle";
import gsap from "gsap";
import RoundedCorners from "./RoundedCorners";

const Story = () => {
  // Core refs
  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const maskRef = useRef(null);
  const lightRef = useRef(null);
  const glowBorderRef = useRef(null);
  const particlesRef = useRef(null);
  const trailRef = useRef(null);
  const reflectionRef = useRef(null);
  const gsapContextRef = useRef(null); // ✨ NEW: GSAP context for better cleanup
  const isItTouchDevice = useRef(
    "ontouchstart" in window || navigator.maxTouchPoints > 0
  );

  // State management
  const [isHovering, setIsHovering] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  });

  // Refs for tracking
  const mouseTrailPoints = useRef([]);
  const frameRef = useRef(null);
  const lastTouchRef = useRef({ x: 0, y: 0 });
  const orientationRef = useRef({ beta: 0, gamma: 0 });
  const lastMouseMoveRef = useRef(0); // ✨ NEW: Throttle tracking
  const isAnimatingRef = useRef(false); // ✨ NEW: Animation in progress flag
  const cachedValuesRef = useRef({}); // ✨ NEW: Cache responsive values

  // ✨ NEW: Throttle function for mouse move
  const throttle = (callback, limit) => {
    return function () {
      const now = Date.now();
      if (now - lastMouseMoveRef.current >= limit) {
        lastMouseMoveRef.current = now;
        callback.apply(this, arguments);
      }
    };
  };

  // Calculate responsive values based on screen size with caching
  const getResponsiveValues = useCallback(() => {
    const { width } = windowSize;

    // ✨ NEW: Check cache first
    if (
      cachedValuesRef.current.width === width &&
      cachedValuesRef.current.isTouchDevice === isTouchDevice
    ) {
      return cachedValuesRef.current.values;
    }

    // Base scale: 1 for desktop, smaller for mobile
    const baseScale = width < 768 ? 0.6 : width < 1024 ? 0.8 : 1;

    // Calculate values
    const values = {
      maxTilt: isTouchDevice ? 12 : 22 * baseScale,
      maxImageMove: isTouchDevice ? 15 : 25 * baseScale,
      maxMaskMove: isTouchDevice ? 25 : 45 * baseScale,
      particleCount: width < 768 ? 15 : width < 1024 ? 25 : 35, // ✨ Slightly reduced
      trailLength: width < 768 ? 4 : width < 1024 ? 7 : 10, // ✨ Slightly reduced
      lightSize: width < 768 ? 300 : width < 1024 ? 400 : 500,
      effectsIntensity: isTouchDevice ? 0.6 : 1.0,
    };

    // ✨ NEW: Store in cache
    cachedValuesRef.current = {
      width,
      isTouchDevice,
      values,
    };

    return values;
  }, [windowSize, isTouchDevice]);

  // Detect device capabilities on mount
  useEffect(() => {
    const detectTouchDevice = () => {
      const isTouchCapable =
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0 ||
        navigator.msMaxTouchPoints > 0 ||
        window.matchMedia("(pointer: coarse)").matches;

      setIsTouchDevice(isTouchCapable);
    };

    // ✨ NEW: Debounce resize handler
    let resizeTimer;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        setWindowSize({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }, 100);
    };

    detectTouchDevice();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimer);
    };
  }, []);

  // Create and setup effects based on device capabilities
  useEffect(() => {
    // ✨ NEW: Create GSAP context for better management
    gsapContextRef.current = gsap.context(() => {});

    const values = getResponsiveValues();

    // ✨ NEW: Use DocumentFragment for batch DOM operations
    const createParticles = () => {
      if (!particlesRef.current) return;

      // Clear existing particles
      while (particlesRef.current.firstChild) {
        particlesRef.current.removeChild(particlesRef.current.firstChild);
      }

      const fragment = document.createDocumentFragment();
      const numParticles = values.particleCount;

      for (let i = 0; i < numParticles; i++) {
        const size = Math.random() * 4 + 1;
        const particle = document.createElement("div");
        particle.className = "story-particle";

        // ✨ OPTIMIZED: Use transform instead of left/top for better performance
        particle.style.cssText = `
          position: absolute;
          width: ${size}px;
          height: ${size}px;
          background: rgba(255, 255, 255, ${Math.random() * 0.7 + 0.3});
          border-radius: 50%;
          transform: translate(${Math.random() * 100}%, ${
          Math.random() * 100
        }%);
          opacity: ${Math.random() * 0.6 * values.effectsIntensity};
          box-shadow: 0 0 ${Math.random() * 12 + 3}px ${
          Math.random() * 4 + 1
        }px 
            rgba(255, 255, 255, ${0.7 * values.effectsIntensity});
          pointer-events: none;
          mix-blend-mode: screen;
          will-change: transform, opacity; 
          filter: blur(${Math.random() * 0.5}px);
        `;

        fragment.appendChild(particle);
      }

      particlesRef.current.appendChild(fragment);
    };

    // Create mouse trail more efficiently
    const createTrail = () => {
      if (!trailRef.current || isTouchDevice) return;

      while (trailRef.current.firstChild) {
        trailRef.current.removeChild(trailRef.current.firstChild);
      }

      const fragment = document.createDocumentFragment();
      const trailLength = values.trailLength;
      mouseTrailPoints.current = [];

      for (let i = 0; i < trailLength; i++) {
        const trail = document.createElement("div");
        trail.className = "mouse-trail-point";
        trail.style.cssText = `
          position: absolute;
          width: ${12 - i * 0.8}px;
          height: ${12 - i * 0.8}px;
          background: rgba(255, 255, 255, ${0.5 - i * 0.04});
          border-radius: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
          opacity: 0;
          mix-blend-mode: screen;
          will-change: transform, opacity;
          filter: blur(${i * 0.2}px);
          z-index: ${100 - i};
        `;

        fragment.appendChild(trail);
        mouseTrailPoints.current.push({ x: 0, y: 0, el: trail });
      }

      trailRef.current.appendChild(fragment);
    };

    // ✨ OPTIMIZED: Batch DOM operations
    createParticles();
    createTrail();

    // Update light effect size based on screen size
    if (lightRef.current) {
      lightRef.current.style.width = `${values.lightSize}px`;
      lightRef.current.style.height = `${values.lightSize}px`;
    }

    // Start breathing animation
    startBreathingAnimation();

    // Setup device orientation handler for touch devices
    if (isTouchDevice && window.DeviceOrientationEvent) {
      window.addEventListener("deviceorientation", handleDeviceOrientation);
    }

    // Cleanup on unmount
    return () => {
      // ✨ NEW: Kill all animations in context
      if (gsapContextRef.current) {
        gsapContextRef.current.revert();
      }

      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }

      if (isTouchDevice && window.DeviceOrientationEvent) {
        window.removeEventListener(
          "deviceorientation",
          handleDeviceOrientation
        );
      }
    };
  }, [isTouchDevice, windowSize, getResponsiveValues]);

  // Handle device orientation for mobile tilt effect
  const handleDeviceOrientation = useCallback((event) => {
    if (!event.beta || !event.gamma) return;

    // ✨ OPTIMIZED: Skip if another animation is in progress
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;

    // Normalize orientation values (beta: -180 to 180, gamma: -90 to 90)
    const normalizedBeta = Math.max(-45, Math.min(45, event.beta)) / 45; // -1 to 1
    const normalizedGamma = Math.max(-45, Math.min(45, event.gamma)) / 45; // -1 to 1

    orientationRef.current = {
      beta: normalizedBeta,
      gamma: normalizedGamma,
    };

    // Apply tilt with requestAnimationFrame to sync with render
    requestAnimationFrame(() => {
      applyTiltFromOrientation();
      isAnimatingRef.current = false;
    });
  }, []);

  // Apply tilt effect based on device orientation data
  const applyTiltFromOrientation = useCallback(() => {
    if (!imageRef.current || !isHovering) return;

    const values = getResponsiveValues();
    const { beta, gamma } = orientationRef.current;

    // Convert orientation to tilt values
    const rotateX = -beta * values.maxTilt * 0.8; // Invert for natural tilt
    const rotateY = gamma * values.maxTilt * 0.8;

    // Calculate movement values
    const maskX = gamma * values.maxMaskMove;
    const maskY = beta * values.maxMaskMove;
    const imageX = -gamma * values.maxImageMove;
    const imageY = -beta * values.maxImageMove;

    // ✨ OPTIMIZED: Use GSAP context for better cleanup
    gsapContextRef.current.add(() => {
      // Apply tilt to image
      gsap.to(imageRef.current, {
        rotateX: rotateX * 0.7,
        rotateY: rotateY * 0.7,
        x: imageX,
        y: imageY,
        duration: 0.6,
        ease: "power2.out",
        overwrite: "auto", // ✨ NEW: Prevent competing animations
      });

      // Apply tilt to mask
      gsap.to(maskRef.current, {
        rotateX: rotateX,
        rotateY: rotateY,
        x: maskX,
        y: maskY,
        duration: 0.5,
        ease: "power2.out",
        overwrite: "auto", // ✨ NEW: Prevent competing animations
      });

      // Position light effect at touch point or center
      if (lightRef.current && lastTouchRef.current) {
        gsap.to(lightRef.current, {
          left: `${lastTouchRef.current.x}%`,
          top: `${lastTouchRef.current.y}%`,
          duration: 0.2,
          overwrite: "auto", // ✨ NEW: Prevent competing animations
        });
      }
    });
  }, [isHovering, getResponsiveValues]);

  // Subtle breathing animation when image is at rest
  const startBreathingAnimation = useCallback(() => {
    if (!imageRef.current) return;

    // ✨ OPTIMIZED: Use context for animations
    gsapContextRef.current.add(() => {
      // Only apply breathing animation if not hovering
      if (!isHovering) {
        gsap.to(imageRef.current, {
          scale: 1.01,
          duration: 2.5,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          overwrite: true,
        });

        if (particlesRef.current?.children?.length) {
          // ✨ OPTIMIZED: Batch animations for particles
          gsap.to(particlesRef.current.children, {
            opacity: (i) => 0.2 + Math.random() * 0.3,
            scale: (i) => 0.8 + Math.random() * 0.3,
            duration: (i) => 1.5 + Math.random() * 2,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
            stagger: {
              each: 0.05,
              from: "random", // ✨ NEW: Randomized stagger looks better and is more efficient
            },
            overwrite: true,
          });
        }
      }
    });
  }, [isHovering]);

  // Update mouse trail positions - throttled
  const updateMouseTrail = useCallback(
    (e) => {
      if (!trailRef.current || !containerRef.current || isTouchDevice) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // ✨ OPTIMIZED: Animate only visible points
      mouseTrailPoints.current.forEach((point, i) => {
        gsapContextRef.current.add(() => {
          gsap.to(point, {
            x: x,
            y: y,
            duration: 0.2 + i * 0.06,
            ease: "power2.out",
            onUpdate: () => {
              if (point.el) {
                // ✨ OPTIMIZED: Use transform instead of left/top
                point.el.style.transform = `translate(${point.x}px, ${point.y}px)`;
                point.el.style.opacity = i === 0 ? "0.7" : "0.5";
              }
            },
            overwrite: "auto",
          });
        });
      });
    },
    [isTouchDevice]
  );

  // Reset all animations when mouse leaves
  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);

    // Skip animation reset on touch devices - we'll use orientation instead
    if (isTouchDevice) return;

    // ✨ OPTIMIZED: Kill only necessary animations and use context
    gsapContextRef.current.add(() => {
      // Reset with enhanced spring bounce
      gsap.to(imageRef.current, {
        x: 0,
        y: 0,
        rotateX: 0,
        rotateY: 0,
        scale: 1,
        filter: "none",
        duration: 1.2,
        ease: "elastic.out(1, 0.3)",
        onComplete: startBreathingAnimation,
        overwrite: true,
      });

      // Reset mask with different timing
      gsap.to(maskRef.current, {
        x: 0,
        y: 0,
        rotateX: 0,
        rotateY: 0,
        duration: 1.0,
        ease: "elastic.out(1, 0.35)",
        overwrite: true,
      });

      // Fade out effects
      gsap.to(
        [lightRef.current, glowBorderRef.current, reflectionRef.current],
        {
          opacity: 0,
          scale: (i, target) => (target === lightRef.current ? 0.8 : 1),
          duration: 0.5,
          ease: "power2.out",
          overwrite: true,
        }
      );

      // Fade out trail
      if (trailRef.current?.children?.length) {
        gsap.to(trailRef.current.children, {
          opacity: 0,
          duration: 0.3,
          stagger: 0.02,
          ease: "power2.out",
          overwrite: true,
        });
      }

      // Reset particles to breathing state
      if (particlesRef.current?.children?.length) {
        gsap.to(particlesRef.current.children, {
          opacity: (i) => Math.random() * 0.4,
          x: 0,
          y: 0,
          scale: 1,
          duration: 0.8,
          stagger: { each: 0.01, from: "random" },
          ease: "power2.out",
          overwrite: true,
        });
      }
    });
  }, [isTouchDevice, startBreathingAnimation]);

  // Start animations when mouse enters
  const handleMouseEnter = useCallback(() => {
    setIsHovering(true);

    // ✨ OPTIMIZED: Use context for animations
    gsapContextRef.current.add(() => {
      const intensity = getResponsiveValues().effectsIntensity;

      // Show light effect with scale animation
      gsap.to(lightRef.current, {
        opacity: 0.9 * intensity,
        scale: 1,
        duration: 0.6,
        ease: "power2.out",
        overwrite: true,
      });

      // Reveal glow border
      gsap.to(glowBorderRef.current, {
        opacity: 0.7 * intensity,
        duration: 0.6,
        ease: "power2.out",
        overwrite: true,
      });

      // Show reflection
      gsap.to(reflectionRef.current, {
        opacity: 0.3 * intensity,
        duration: 0.6,
        ease: "power2.out",
        overwrite: true,
      });

      // Animate particles
      if (particlesRef.current?.children?.length) {
        gsap.fromTo(
          particlesRef.current.children,
          { opacity: 0.2, scale: 0.8 },
          {
            opacity: (i) => Math.random() * 0.8 * intensity + 0.4 * intensity,
            scale: (i) => Math.random() * 0.5 + 0.9,
            stagger: { each: 0.02, from: "random" },
            duration: 0.8,
            ease: "power2.out",
            overwrite: true,
          }
        );
      }
    });
  }, [getResponsiveValues]);

  // ✨ OPTIMIZED: Throttled mouse move handler
  const handleMouseMove = useCallback(
    throttle(
      (e) => {
        if (!containerRef.current || isTouchDevice) return;

        const rect = containerRef.current.getBoundingClientRect();

        // Normalized mouse position from -1 to 1
        const xRatio = (e.clientX - rect.left) / rect.width;
        const yRatio = (e.clientY - rect.top) / rect.height;
        const x = xRatio * 2 - 1; // -1 to 1
        const y = yRatio * 2 - 1; // -1 to 1

        // Update mouse trail
        updateMouseTrail(e);

        // Get responsive values
        const values = getResponsiveValues();

        // Calculate transformations with enhanced values
        const imageX = -x * values.maxImageMove;
        const imageY = -y * values.maxImageMove;
        const maskX = x * values.maxMaskMove;
        const maskY = y * values.maxMaskMove;
        const rotateY = x * values.maxTilt;
        const rotateX = -y * values.maxTilt;

        // Calculate distance from center for effects intensity
        const distFromCenter = Math.sqrt(x * x + y * y);
        const intensity = values.effectsIntensity;

        // ✨ OPTIMIZED: Batch all animations in context
        gsapContextRef.current.add(() => {
          // Update image with enhanced visual effects
          gsap.to(imageRef.current, {
            x: imageX,
            y: imageY,
            rotateX: rotateX * 0.7,
            rotateY: rotateY * 0.7,
            scale: 1 + distFromCenter * 0.03 * intensity,
            filter: `contrast(${
              1 + distFromCenter * 0.1 * intensity
            }) brightness(${1 + distFromCenter * 0.08 * intensity}) saturate(${
              1 + distFromCenter * 0.1 * intensity
            })`,
            duration: 0.6,
            ease: "power2.out",
            overwrite: "auto",
          });

          // Position the light effect at mouse position with enhanced glow
          gsap.to(lightRef.current, {
            left: `${xRatio * 100}%`,
            top: `${yRatio * 100}%`,
            boxShadow: `0 0 ${30 + distFromCenter * 20 * intensity}px ${
              15 + distFromCenter * 20 * intensity
            }px rgba(255,255,255,${0.25 * intensity})`,
            duration: 0.2,
            overwrite: "auto",
          });

          // Update reflection based on tilt
          if (reflectionRef.current) {
            const reflectionOpacity = (0.2 + distFromCenter * 0.3) * intensity;

            gsap.to(reflectionRef.current, {
              background: `linear-gradient(${
                135 + rotateY
              }deg, rgba(255,255,255,${reflectionOpacity}) 0%, rgba(255,255,255,0) 80%)`,
              backgroundPosition: `${xRatio * 100}% ${yRatio * 100}%`,
              backgroundSize: `${200 + distFromCenter * 50}% ${
                200 + distFromCenter * 50
              }%`,
              duration: 0.3,
              overwrite: "auto",
            });
          }

          // Enhanced mask animation
          gsap.to(maskRef.current, {
            x: maskX,
            y: maskY,
            rotateX: rotateX,
            rotateY: rotateY,
            filter: `hue-rotate(${distFromCenter * 10 * intensity}deg)`,
            duration: 0.5,
            ease: "power2.out",
            overwrite: "auto",
          });

          // Position glow border to follow mouse with enhanced effects
          if (glowBorderRef.current) {
            const glowPosition = Math.atan2(y, x) * (180 / Math.PI);
            const distance = Math.sqrt(x * x + y * y) * 40 * intensity;

            gsap.to(glowBorderRef.current, {
              background: `linear-gradient(${glowPosition}deg, rgba(255,255,255,${
                0.2 * intensity
              }) 0%, rgba(255,255,255,${
                0.1 * intensity
              }) 40%, rgba(255,255,255,0) 60%)`,
              boxShadow: `0 0 ${distance}px ${
                distance / 2.5
              }px rgba(255,255,255,${0.15 * intensity})`,
              backdropFilter: `blur(${distFromCenter * 2 * intensity}px)`,
              duration: 0.3,
              overwrite: "auto",
            });
          }
        });

        // ✨ OPTIMIZED: Handle particles in a separate batch with fewer updates
        if (
          !isAnimatingRef.current &&
          particlesRef.current?.children?.length > 0
        ) {
          isAnimatingRef.current = true;

          // Use requestAnimationFrame to sync with rendering cycle
          requestAnimationFrame(() => {
            gsapContextRef.current.add(() => {
              // Animate only a subset of particles each time for better performance
              const particles = Array.from(particlesRef.current.children);
              const particlesToAnimate =
                windowSize.width < 768
                  ? particles.filter((_, i) => i % 3 === 0) // Animate 1/3 on mobile
                  : particles.filter((_, i) => i % 2 === 0); // Animate 1/2 on desktop

              gsap.to(particlesToAnimate, {
                x: (i, el) => {
                  const idx = particles.indexOf(el);
                  const particleDistance = (idx % 3) * 5 + 5;
                  const directionFactor = idx % 2 === 0 ? 1 : -0.5;
                  return (
                    x *
                    particleDistance *
                    directionFactor *
                    (idx % 5) *
                    intensity
                  );
                },
                y: (i, el) => {
                  const idx = particles.indexOf(el);
                  const particleDistance = (idx % 3) * 5 + 5;
                  const directionFactor = idx % 2 === 0 ? 1 : -0.5;
                  return (
                    y *
                    particleDistance *
                    directionFactor *
                    ((idx + 2) % 5) *
                    intensity
                  );
                },
                scale: (i, el) => {
                  const idx = particles.indexOf(el);
                  return 0.8 + distFromCenter * (idx % 3) * 0.5 * intensity;
                },
                opacity: (i) =>
                  (0.3 + distFromCenter * 0.4 * (Math.random() + 0.5)) *
                  intensity,
                duration: 0.8,
                ease: "power1.out",
                overwrite: "auto",
              });
            });

            isAnimatingRef.current = false;
          });
        }
      },
      16 // 60fps throttle - PARENTESI CHIUSA AGGIUNTA QUI
    ),
    [isTouchDevice, updateMouseTrail, getResponsiveValues, windowSize]
  );

  // Touch event handlers
  const handleTouchStart = useCallback(
    (e) => {
      setIsHovering(true);
      handleMouseEnter();
      updateTouchPosition(e);
    },
    [handleMouseEnter]
  );

  const handleTouchMove = useCallback((e) => {
    // Remove preventDefault() call to allow normal scrolling
    // Only prevent default for specific interactions if needed

    // ✨ OPTIMIZED: Throttle touch moves
    const now = Date.now();
    if (now - lastMouseMoveRef.current < 32) return; // ~30fps for touch moves
    lastMouseMoveRef.current = now;

    updateTouchPosition(e);
  }, []);

  const handleTouchEnd = useCallback(() => {
    // For touch devices, we keep the effect active for a moment before fading
    setTimeout(() => {
      setIsHovering(false);
      handleMouseLeave();
    }, 1500);
  }, [handleMouseLeave]);

  // Update touch position for effects
  const updateTouchPosition = useCallback((e) => {
    if (!containerRef.current || e.touches.length === 0) return;

    const touch = e.touches[0];
    const rect = containerRef.current.getBoundingClientRect();

    // Calculate touch position as percentages
    const xRatio = (touch.clientX - rect.left) / rect.width;
    const yRatio = (touch.clientY - rect.top) / rect.height;

    // Store last touch position (0-100%)
    lastTouchRef.current = { x: xRatio * 100, y: yRatio * 100 };
  }, []);

  const handleRuneterraClick = () => {
    // prevent default and open in a new tab
    window.open("https://universe.leagueoflegends.com/en_US/", "_blank");
  };

  return (
    <section
      id="story"
      className="min-h-screen w-screen bg-black text-white-50 overflow-hidden story-section"
    >
      <div className="flex size-full flex-col items-center py-10 pb-24">
        <p className="font-family-general text-sm uppercase md:text-[10px]">
          League of Legends Story
        </p>
        <div className="relative size-full">
          <AnimatedTitle
            title="The st<b>o</b>ry <br /> of Ru<b>n</b>eterra"
            sectionId="#story"
            containerClass="mt-5 pointer-events-none mix-blend-difference relative z-10"
          />
          <div
            ref={containerRef}
            className="story-img-container relative story-tilt-container"
            onMouseLeave={!isTouchDevice ? handleMouseLeave : undefined}
            onMouseEnter={!isTouchDevice ? handleMouseEnter : undefined}
            onMouseMove={!isTouchDevice ? handleMouseMove : undefined}
            onTouchStart={isTouchDevice ? handleTouchStart : undefined}
            onTouchMove={isTouchDevice ? handleTouchMove : undefined}
            onTouchEnd={isTouchDevice ? handleTouchEnd : undefined}
            style={{ touchAction: "pan-y" }} // Add this to allow vertical scrolling but handle horizontal touches
          >
            {/* Mouse trail effect - only on non-touch */}
            {!isTouchDevice && (
              <div
                ref={trailRef}
                className="absolute pointer-events-none z-40 inset-0 overflow-hidden"
              />
            )}

            {/* Text overlay - positioned on the right side of the image */}

            {/* Enhanced glow border effect */}
            <div
              ref={glowBorderRef}
              className="absolute pointer-events-none z-20 inset-0 opacity-0 rounded-[inherit]"
            />

            {/* Holographic reflection effect */}
            <div
              ref={reflectionRef}
              className="absolute pointer-events-none z-25 inset-0 opacity-0 holographic-reflection"
            />

            {/* Enhanced light effect overlay */}
            <div
              ref={lightRef}
              className="absolute pointer-events-none z-30 rounded-full bg-gradient-radial from-white/60 via-white/25 to-transparent opacity-0 scale-90"
              style={{
                width: getResponsiveValues().lightSize + "px",
                height: getResponsiveValues().lightSize + "px",
                transform: "translate(-50%, -50%)",
                mixBlendMode: "screen",
                willChange: "transform, opacity, box-shadow", // ✨ NEW
              }}
            />

            {/* Particle container */}
            <div
              ref={particlesRef}
              className="absolute pointer-events-none z-25 inset-0 overflow-hidden"
              // ✨ NEW: Use contain for visual components but let layers overflow
              style={{ contain: "paint" }}
            />

            {/* Moving mask with perspective */}
            <div
              ref={maskRef}
              className={`story-img-mask will-change-transform ${
                isTouchDevice ? "touch-mask" : ""
              }`}
              style={{
                perspective: windowSize.width < 768 ? "1000px" : "1500px",
                transformStyle: "preserve-3d",
                transformOrigin: "center center",
                clipPath:
                  windowSize.width < 768
                    ? "polygon(2% 0, 85% 5%, 98% 85%, 0% 100%)"
                    : undefined,
                willChange: "transform, filter", // ✨ NEW
              }}
            >
              <div
                className={`story-img-content overflow-hidden ${
                  isTouchDevice ? "touch-content" : ""
                }`}
                style={{
                  left: windowSize.width < 768 ? "0" : undefined,
                  top: windowSize.width < 768 ? "0" : undefined,
                  willChange: "transform", // ✨ NEW
                }}
              >
                <img
                  ref={imageRef}
                  src="./images/entrance-1.webp"
                  alt="entrance to Runeterra"
                  className={`object-contain will-change-transform ${
                    isTouchDevice ? "touch-image" : "chromatic-edge"
                  }`}
                  style={{
                    transformStyle: "preserve-3d",
                    objectFit: windowSize.width < 768 ? "contain" : "cover",
                    objectPosition:
                      windowSize.width < 768 ? "center" : undefined,
                    boxShadow:
                      isHovering &&
                      `0 ${windowSize.width < 768 ? "20px" : "30px"} ${
                        windowSize.width < 768 ? "40px" : "70px"
                      } rgba(0,0,0,0.45), 0 ${
                        windowSize.width < 768 ? "10px" : "15px"
                      } ${
                        windowSize.width < 768 ? "15px" : "25px"
                      } rgba(0,0,0,0.3)`,
                    transition:
                      "filter 0.5s ease-out, box-shadow 0.5s ease-out",
                    willChange: "transform, filter",
                  }}
                />
              </div>
            </div>
            <RoundedCorners />
          </div>
          <div className="absolute right-[50%] w-full translate-x-[50%] top-[60%] z-50 max-w-sm p-4 md:p-6 md:max-w-xs lg:max-w-sm bg-black/40 backdrop-blur-sm rounded-tl-lg md:right-[30%] md:top-[66%] flex flex-col items-start">
            <p className="text-white font-family-circular-web text-sm md:text-base drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
              Beyond the veil of battle lies Runeterra—alive with lore,
              conflict, and destiny. Enter its story and carve your legacy among
              champions.
            </p>
            <a
              onClick={
                !isItTouchDevice.current ? handleRuneterraClick : undefined
              }
              href={
                isItTouchDevice.current
                  ? "https://universe.leagueoflegends.com/en_US/"
                  : undefined
              }
              className="rounded-full mt-5 w-fit h-fit px-7 py-3 bg-league-of-legends-gold-400 hover:bg-league-of-legends-gold-400/80 cursor-pointer text-black font-family-general uppercase text-sm transition-all duration-300 ease-in-out"
            >
              Discover now
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Story;

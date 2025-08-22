import { useState, useRef, useEffect } from "react";
import Button from "./Button";
import { TiLocationArrow } from "react-icons/ti";
import { FaVolumeMute } from "react-icons/fa";
import { FaVolumeHigh } from "react-icons/fa6";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/all";

gsap.registerPlugin(ScrollTrigger);

// Audio fade duration (seconds) used for GSAP volume tweens
const AUDIO_FADE_DURATION = 0.2;
// Scroll-based fade duration (seconds) for fade-out/in when leaving/entering hero
const SCROLL_VOLUME_FADE_DURATION = 1;

const Hero = () => {
  // Add this state to track touch devices
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(1);
  const [currentVideoIndexDelayed, setCurrentVideoIndexDelayed] = useState(1);
  const [hasTheUserClickedNextVideo, setHasTheUserClickedNextVideo] =
    useState(false);
  const [loaderVisible, setLoaderVisible] = useState(true);
  const [didTheUserInteracted, setDidTheUserInteracted] = useState(false);
  const [isTheCurrentVideoHovered, setIsTheCurrentVideoHovered] =
    useState(false);
  const [isMouseMoving, setIsMouseMoving] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [hasTheUserMuted, setHasTheUserMuted] = useState(false);
  const [isItZoomingNewVideo, setIsItZoomingNewVideo] = useState(false);
  const [isTheHeroScrolledOut, setIsTheHeroScrolledOut] = useState(false);
  const [volume, setVolume] = useState(0.25);
  const [mutedByVisibilityChange, setMutedByVisibilityChange] = useState(false);
  const [isSmallBoxHovered, setIsSmallBoxHovered] = useState(false); // Hover state for the mini box
  // Current transform and inner image offset of the mini box
  const [isVolumeZero, setIsVolumeZero] = useState(false);
  const [previousFrameSrc, setPreviousFrameSrc] = useState("");
  const [actualSmallBoxPosition, setActualSmallBoxPosition] = useState({
    x: 0,
    y: 0,
    rotationX: 0,
    rotationY: 0,
    imageX: 0,
    imageY: 0,
  });
  // Idle timeout before hiding the mini box
  const defaultAfkTime = 500;
  const [smallBoxAfkDuration, setSmallBoxAfkDuration] =
    useState(defaultAfkTime);

  // Mini box visibility state and hide timer
  const [smallBoxVisible, setSmallBoxVisible] = useState(false);
  const smallBoxHideTimerRef = useRef(null);

  const particlesRef = useRef(null);
  const overlayRef = useRef(null);
  // Track the active volume tween to avoid overlaps
  const volumeTweenRef = useRef(null);
  // Track previous scroll state to choose fade-in duration
  const prevIsScrolledOutRef = useRef(false);

  const [lastMousePosition, setLastMousePosition] = useState({ x: 0, y: 0 });
  const lastPointerRef = useRef({ x: 0, y: 0 }); // Last mouse pointer position

  const totalVideos = 5;
  const YTLinks = [
    "https://www.youtube.com/watch?v=zF5Ddo9JdpY",
    "https://www.youtube.com/watch?v=zF5Ddo9JdpY",
    "https://youtu.be/ZHhqwBwmRkI?list=RDZHhqwBwmRkI",
    "https://www.youtube.com/watch?v=zF5Ddo9JdpY",
    "https://youtu.be/ZHhqwBwmRkI?list=RDZHhqwBwmRkI",
  ];

  const currentVideoRef = useRef(null);
  const nextVideoRef = useRef(null);
  const previousVideoRef = useRef(null);
  const previousFrameImgRef = useRef(null);
  const smallBoxRef = useRef(null);
  const smallBoxInnerRef = useRef(null);
  // Cache last known transform to avoid snapping when hidden
  const lastPositionRef = useRef({ x: 0, y: 0, rotateX: 0, rotateY: 0 });

  // Loader hero locale: consideriamo mappa di video già caricati
  const loadedHeroVideosRef = useRef(new Set());
  const [heroLoading, setHeroLoading] = useState(true); // mostra overlay finché primo video pronto o mentre carica un nuovo non ancora visto

  // Detect touch-capable displays and set state so the UI can react
  useEffect(() => {
    const detectTouch = () => {
      const isTouchCapable =
        (typeof window !== "undefined" && "ontouchstart" in window) ||
        (typeof navigator !== "undefined" && navigator.maxTouchPoints > 0) ||
        (typeof navigator !== "undefined" && navigator.msMaxTouchPoints > 0) ||
        (typeof window !== "undefined" &&
          window.matchMedia &&
          window.matchMedia("(hover: none)").matches);

      setIsTouchDevice(Boolean(isTouchCapable));
    };

    // run once and also on resize (some devices can change capabilities on rotation)
    detectTouch();
    window.addEventListener("resize", detectTouch, { passive: true });
    return () => window.removeEventListener("resize", detectTouch);
  }, []);

  // Manteniamo la semantica esistente 'isLoading' ma guidata da heroLoading
  useEffect(() => {
    if (heroLoading) setLoaderVisible(true);
    else setTimeout(() => setLoaderVisible(false), 200);
  }, [heroLoading]);

  useGSAP(() => {
    gsap.set("#video-frame", {
      clipPath: "polygon(14% 0%, 72% 0%, 90% 90%, 0% 100%)",
      borderRadius: "0 0 40% 10%",
    });
    gsap.from("#video-frame", {
      clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
      borderRadius: "0 0 0 0",
      ease: "power1.inOut",
      scrollTrigger: {
        trigger: "#video-frame",
        start: "center center",
        end: "bottom center",
        scrub: true,
      },
    });
    ScrollTrigger.create({
      trigger: "#video-frame",
      start: "top 0.1%",
      end: "bottom 99.9%",
      onEnter: () => setIsTheHeroScrolledOut(false),
      onLeave: () => setIsTheHeroScrolledOut(true),
      onEnterBack: () => setIsTheHeroScrolledOut(false),
      onLeaveBack: () => setIsTheHeroScrolledOut(true),
    });
  }, []);

  // Rimosso vecchio conteggio; ora dipende da loadedHeroVideosRef

  // Create and animate particles overlay for the mini box
  useEffect(() => {
    if (!smallBoxRef.current || !smallBoxVisible) return;

    // Create particle container if it doesn't exist
    if (!particlesRef.current) {
      const particlesContainer = document.createElement("div");
      particlesContainer.className = "particle-container";
      particlesContainer.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 5;
        pointer-events: none;
        overflow: hidden;
      `;
      smallBoxRef.current.appendChild(particlesContainer);
      particlesRef.current = particlesContainer;
    }

    // Create particles only once
    if (particlesRef.current && particlesRef.current.children.length === 0) {
      const numParticles = 10;

      for (let i = 0; i < numParticles; i++) {
        const particle = document.createElement("div");
        particle.className = "particle";
        particle.style.cssText = `
          position: absolute;
          width: ${Math.random() * 3 + 1}px;
          height: ${Math.random() * 3 + 1}px;
          background: rgba(255, 255, 255, ${Math.random() * 0.3 + 0.1});
          border-radius: 50%;
          pointer-events: none;
          left: ${Math.random() * 100}%;
          top: ${Math.random() * 100}%;
          opacity: 0;
        `;
        particlesRef.current.appendChild(particle);

        // Animate each particle
        gsap.to(particle, {
          x: `random(-40, 40)`,
          y: `random(-40, 40)`,
          opacity: `random(0.1, 0.4)`,
          duration: `random(3, 5)`,
          delay: `random(0, 2)`,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }
    }

    // Mostra o nascondi particelle in base alla visibilità
    if (particlesRef.current) {
      gsap.to(particlesRef.current.children, {
        opacity: smallBoxVisible ? 0.3 : 0,
        duration: 0.5,
      });
    }

    return () => {
      // No-op cleanup for particles
    };
  }, [smallBoxVisible]);

  // Tilt + follow animation for the mini box
  useEffect(() => {
    if (!smallBoxRef.current) return;

    // Detect touch devices
    const isTouchDevice = () => {
      return (
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0 ||
        navigator.msMaxTouchPoints > 0
      );
    };

    // Disable the tilt effect entirely on touch devices
    const isTouch =
      isTouchDevice() || window.matchMedia("(hover: none)").matches;
    if (isTouch) return;

    const videoElement = smallBoxInnerRef.current;

    // Create overlay if missing
    if (!overlayRef.current && smallBoxRef.current) {
      const overlay = document.createElement("div");
      overlay.className = "smallbox-overlay";
      overlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10;
        pointer-events: none;
        opacity: 0;
        border-radius: 0.5rem;
        background: radial-gradient(circle at 50% 50%, rgba(255,255,255,0.15), rgba(0,0,0,0.15));
      `;
      smallBoxRef.current.appendChild(overlay);
      overlayRef.current = overlay;
    }

    // Initialize base transform values for the mini box
    gsap.set(smallBoxRef.current, {
      rotationX: 0,
      rotationY: 0,
      rotationZ: 0,
      transformPerspective: 1000,
      transformOrigin: "center center",
      transformStyle: "preserve-3d",
    });

    // Initialize inner image zoom (bigger than the mini box to allow inner movement)
    if (videoElement) {
      gsap.set(videoElement, { scale: 3.2 });
    }

    let mouseX = 0,
      mouseY = 0;
    let currentRotateX = 0,
      currentRotateY = 0;
    let frameId;

    const animateTilt = () => {
      // Always compute position to keep lastPositionRef updated
      if (!smallBoxRef.current) {
        frameId = requestAnimationFrame(animateTilt);
        return;
      }

      const rect = smallBoxRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = (mouseX - centerX) / (window.innerWidth * 0.3);
      const deltaY = (mouseY - centerY) / (window.innerHeight * 0.3);

      const maxTilt = window.innerWidth < 768 ? 15 : 20;

      const targetRotateX = Math.max(
        Math.min(deltaY * maxTilt, maxTilt),
        -maxTilt
      );
      const targetRotateY = Math.max(
        Math.min(-deltaX * maxTilt, maxTilt),
        -maxTilt
      );

      const easing = 0.08;
      currentRotateX += (targetRotateX - currentRotateX) * easing;
      currentRotateY += (targetRotateY - currentRotateY) * easing;

      // Compute attraction of the box towards the pointer
      const attractionFactor = window.innerWidth < 768 ? 30 : 200;
      const attractX = (mouseX / window.innerWidth - 0.5) * attractionFactor;
      const attractY = (mouseY / window.innerHeight - 0.5) * attractionFactor;

      // Save last known position/rotation when the box is visible
      if (smallBoxVisible) {
        lastPositionRef.current = {
          x: attractX,
          y: attractY,
          rotateX: currentRotateX,
          rotateY: currentRotateY,
        };
      }

      // Use last known transform when hidden, otherwise current
      const finalX = smallBoxVisible ? attractX : lastPositionRef.current.x;
      const finalY = smallBoxVisible ? attractY : lastPositionRef.current.y;
      const finalRotateX = smallBoxVisible
        ? currentRotateX
        : lastPositionRef.current.rotateX;
      const finalRotateY = smallBoxVisible
        ? currentRotateY
        : lastPositionRef.current.rotateY;

      // Apply rotation/position every frame; opacity is handled via CSS
      gsap.set(smallBoxRef.current, {
        rotationX: finalRotateX,
        rotationY: finalRotateY,
        rotationZ: 0,
        x: finalX,
        y: finalY,
        // Non gestiamo più l'opacità qui, la gestiamo con CSS
      });
      // Salva la posizione attuale per il prossimo frame

      // Extra visual effects only when visible
      if (smallBoxVisible) {
        setActualSmallBoxPosition({
          x: finalX,
          y: finalY,
          rotationX: finalRotateX,
          rotationY: finalRotateY,
          imageX: currentRotateY * 8,
          imageY: -currentRotateX * 8,
        });
        // Parallax on inner image (mimics the old video overscan movement)
        if (videoElement) {
          gsap.set(videoElement, {
            x: currentRotateY * 8,
            y: -currentRotateX * 8,
            scale: 3.2,
          });
        }

        // Overlay intensity relative to pointer distance
        if (overlayRef.current) {
          const lightX = 50 + deltaX * 40;
          const lightY = 50 + deltaY * 40;
          const intensity =
            Math.sqrt(deltaX * deltaX + deltaY * deltaY) * 0.4 + 0.15;

          gsap.set(overlayRef.current, {
            opacity: intensity,
            background: `radial-gradient(circle at ${lightX}% ${lightY}%, rgba(255,255,255,0.2), rgba(0,0,0,0.15))`,
          });
        }

        // Particle drift reacts to movement
        if (particlesRef.current && particlesRef.current.children.length > 0) {
          const moveIntensity =
            Math.sqrt(deltaX * deltaX + deltaY * deltaY) * 2;

          gsap.to(particlesRef.current.children, {
            x: `+=${-deltaX * 10}`,
            y: `+=${-deltaY * 10}`,
            opacity: 0.1 + moveIntensity * 0.3,
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
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [smallBoxVisible]);

  // Hide mini box immediately if hero scrolls out
  useEffect(() => {
    if (isTheHeroScrolledOut) {
      setSmallBoxVisible(false);
      if (smallBoxHideTimerRef.current) {
        clearTimeout(smallBoxHideTimerRef.current);
        smallBoxHideTimerRef.current = null;
      }
    }
  }, [isTheHeroScrolledOut]);

  // Show/hide mini box after inactivity; require 20px movement to re-show
  useEffect(() => {
    if (isTheHeroScrolledOut) return;

    const startHideTimer = () => {
      if (smallBoxHideTimerRef.current)
        clearTimeout(smallBoxHideTimerRef.current);

      smallBoxHideTimerRef.current = setTimeout(() => {
        // Save pointer position at hide start (anchor for dead-zone)
        setLastMousePosition(lastPointerRef.current);
        if (!isSmallBoxHovered) setSmallBoxVisible(false);
        setIsMouseMoving(false);
      }, smallBoxAfkDuration);
    };

    const handleMouseMove = (e) => {
      const x = e.clientX;
      const y = e.clientY;
      lastPointerRef.current = { x, y };

      // If mouse is over the box area, show it immediately (ignore 20px rule)
      if (!smallBoxVisible && smallBoxRef.current) {
        const rect = smallBoxRef.current.getBoundingClientRect();
        const isOverBox =
          x >= rect.left &&
          x <= rect.right &&
          y >= rect.top &&
          y <= rect.bottom;

        if (isOverBox) {
          setSmallBoxVisible(true);
          setIsMouseMoving(true);
          setLastMousePosition({ x, y }); // reset anchor for the threshold
          startHideTimer();
          return;
        }
      }

      // Euclidean threshold: at least 20px moved from last saved position
      const dx = x - lastMousePosition.x;
      const dy = y - lastMousePosition.y;
      const movedEnough = dx * dx + dy * dy >= 20 * 20;

      if (!movedEnough) return;

      setSmallBoxVisible(true);
      setIsMouseMoving(true);
      startHideTimer();
    };

    window.addEventListener("mousemove", handleMouseMove);
    startHideTimer();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (smallBoxHideTimerRef.current)
        clearTimeout(smallBoxHideTimerRef.current);
    };
  }, [
    isTheHeroScrolledOut,
    isSmallBoxHovered,
    smallBoxAfkDuration,
    lastMousePosition,
    smallBoxVisible, // NEW: per valutare la condizione “se invisibile e sopra il box”
  ]);

  // Quando il "previous" video (sempre nascosto) termina il load lo pause/reset
  const handlePreviousLoaded = () => {
    if (previousVideoRef.current) {
      previousVideoRef.current.pause();
      try {
        previousVideoRef.current.currentTime = 0;
      } catch (e) {}
    }
  };

  const handleMiniVideoClick = () => {
    if (
      isItZoomingNewVideo ||
      isTheHeroScrolledOut ||
      hasTheUserClickedNextVideo ||
      isItZoomingNewVideo
    ) {
      return;
    }
    if (!didTheUserInteracted) {
      setDidTheUserInteracted(true);
      return;
    }
    if (!currentVideoRef.current) return;

    // Capture a snapshot of the current video to display as the previous frame
    try {
      const v = currentVideoRef.current;
      if (v && v.videoWidth && v.videoHeight) {
        const canvas = document.createElement("canvas");
        canvas.width = v.videoWidth;
        canvas.height = v.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        setPreviousFrameSrc(dataUrl);
      }
    } catch (e) {
      // ignore snapshot errors
    }

    // Sync next indices and preserve current playback position
    let nextIdxTemp = null;
    setCurrentVideoIndex((prevIndex) => {
      const n = (prevIndex % totalVideos) + 1;
      nextIdxTemp = n;
      return n;
    });
    setSmallBoxAfkDuration(2600);

    // Snapshot the outgoing frame onto the previous video, then keep it paused
    setTimeout(() => {
      if (!previousVideoRef.current || !currentVideoRef.current) return;
      try {
        previousVideoRef.current.currentTime =
          currentVideoRef.current.currentTime;
        previousVideoRef.current.pause();
      } catch (e) {
        // seeking may fail if metadata not ready; ignore
      }
    }, 1);
    setHasTheUserClickedNextVideo(true);
    setTimeout(() => {
      setCurrentVideoIndexDelayed((prevIndex) => {
        const incoming = (prevIndex % totalVideos) + 1;
        // Se il video in arrivo non è stato caricato prima, mostra il loader hero
        const incomingSrc = getVideoSrc(incoming);
        if (!loadedHeroVideosRef.current.has(incomingSrc)) {
          setHeroLoading(true);
        }
        return incoming;
      });
      setIsItZoomingNewVideo(true);
      const smallBoxRect = smallBoxRef.current.getBoundingClientRect();
      const { rotationX, rotationY } = actualSmallBoxPosition;

      // Mini box animation: delay 0.2s, duration 2.5s, ease power2.inOut
      gsap.fromTo(
        smallBoxRef.current,
        { scale: 0 },
        {
          scale: 1,
          duration: 2.5,
          delay: 0.2,
          ease: "power2.inOut",
          onStart: () => {
            setSmallBoxVisible(true);
          },
          onComplete: () => {
            setIsItZoomingNewVideo(false);
            setHasTheUserClickedNextVideo(false);
            setSmallBoxAfkDuration(defaultAfkTime);
          },
        }
      );

      // Current video expands from the mini box position
      if (!isTouchDevice) {
        gsap.from(currentVideoRef.current, {
          height: "250px",
          width: "250px",
          x: smallBoxRect.x,
          y: smallBoxRect.y,
          rotationX: rotationX,
          rotationY: rotationY,
          borderRadius: "2rem",
          border: "1px solid rgba(255, 255, 255, 0.2)",
        });
      } else {
        gsap.from(currentVideoRef.current, {
          height: "80px",
          width: "80px",
          x: smallBoxRect.x,
          y: smallBoxRect.y,
          rotationX: rotationX,
          rotationY: rotationY,
          borderRadius: "2rem",
          border: "1px solid rgba(255, 255, 255, 0.2)",
        });
      }

      gsap.to(currentVideoRef.current, {
        x: 0,
        y: 0,
        rotationX: 0,
        rotationY: 0,
        width: "100%",
        height: "100%",
        borderRadius: "0",
        border: "none",
        ease: "power2.out",
        duration: 2,
        onComplete: () => {
          // Clear the snapshot once the zoom animation completes
          setTimeout(() => setPreviousFrameSrc(""), 150);
        },
      });
    }, 100);
  };

  useEffect(() => {
    const enableAudio = () => {
      setDidTheUserInteracted(true);
      window.removeEventListener("click", enableAudio);
    };
    if (!didTheUserInteracted) window.addEventListener("click", enableAudio);
    return () => window.removeEventListener("click", enableAudio);
  }, [didTheUserInteracted]);

  useEffect(() => {
    const video = currentVideoRef.current;
    if (!video) return;

    // Kill any previous volume tween to prevent overlapping animations
    if (volumeTweenRef.current) {
      volumeTweenRef.current.kill();
      volumeTweenRef.current = null;
    }

    // 1) If hero is scrolled out: fade down to 0 over SCROLL_FADE_DURATION, then mute
    if (isTheHeroScrolledOut) {
      if (isAudioEnabled) {
        volumeTweenRef.current = gsap.to(video, {
          volume: 0,
          duration: SCROLL_VOLUME_FADE_DURATION,
          ease: "power2.out",
          onComplete: () => {
            setIsAudioEnabled(false); // this toggles the <video muted> attr after fade
          },
        });
      } else {
        // Already muted/disabled: ensure volume is at 0
        gsap.set(video, { volume: 0 });
      }

      // Update previous state and exit
      prevIsScrolledOutRef.current = true;
      return;
    }

    // 2) If user-muted or hasn't interacted: fade down quickly and mute
    if (hasTheUserMuted || !didTheUserInteracted) {
      if (isAudioEnabled) {
        volumeTweenRef.current = gsap.to(video, {
          volume: 0,
          duration: SCROLL_VOLUME_FADE_DURATION,
          ease: "power2.out",
          onComplete: () => setIsAudioEnabled(false),
        });
      } else {
        gsap.set(video, { volume: 0 });
      }
      prevIsScrolledOutRef.current = false;
      return;
    }

    // 3) Otherwise: hero is visible and audio allowed → fade up to target volume
    const comingBackFromScroll = prevIsScrolledOutRef.current;
    const fadeUpDuration = comingBackFromScroll
      ? SCROLL_VOLUME_FADE_DURATION
      : AUDIO_FADE_DURATION;

    // Unmute first so the fade-up is audible
    if (!isAudioEnabled) setIsAudioEnabled(true);
    if (video.muted) video.muted = false;

    volumeTweenRef.current = gsap.to(video, {
      volume: volume,
      duration: fadeUpDuration,
      ease: "power2.in",
    });

    prevIsScrolledOutRef.current = false;
  }, [
    isTheHeroScrolledOut,
    hasTheUserMuted,
    didTheUserInteracted,
    isAudioEnabled,
    volume,
  ]);

  const getVideoSrc = (index) => `./videos/hero-${index}.webm`;
  const getPosterSrc = (index) => `./images/hero-${index}.webp`;

  const showShadow =
    (isMouseMoving &&
      isTheCurrentVideoHovered &&
      !isItZoomingNewVideo &&
      !isTheHeroScrolledOut) ||
    (isSmallBoxHovered && !isTheHeroScrolledOut);

  const handleAudioClick = () => {
    if (isTheHeroScrolledOut || !didTheUserInteracted || isVolumeZero) return;
    const newMutedState = !hasTheUserMuted;
    setHasTheUserMuted(newMutedState);
  };

  const handleVolumeChange = (e) => {
    const newVolume = Number(e.target.value) / 100;
    if (newVolume === 0) {
      setIsVolumeZero(true);
    } else {
      setIsVolumeZero(false);
    }
    setVolume(newVolume);
    if (currentVideoRef.current) currentVideoRef.current.volume = newVolume;
    if (isAudioEnabled) {
      gsap.to(currentVideoRef.current, {
        volume: newVolume,
        duration: AUDIO_FADE_DURATION,
        ease: "power2.in",
      });
    }
  };

  // Add this new useEffect to explicitly play the video once it's loaded
  useEffect(() => {
    if (currentVideoRef.current) {
      // This promise-based approach handles autoplay restrictions better
      const playPromise = currentVideoRef.current.play();

      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          // Auto-play was prevented, try playing muted
          if (currentVideoRef.current) {
            currentVideoRef.current.muted = true;
            currentVideoRef.current
              .play()
              .catch((e) => console.log("Still couldn't play video:", e));
          }
        });
      }
    }
  }, [currentVideoRef.current]);

  // Ensure the previous video is always paused and reset when the main index changes
  useEffect(() => {
    if (previousVideoRef.current) {
      previousVideoRef.current.pause();
      try {
        previousVideoRef.current.currentTime = 0;
      } catch (e) {}
    }
  }, [currentVideoIndexDelayed]);

  // Keep the mini (next) media paused even when visible (skip for image posters)
  useEffect(() => {
    const v = nextVideoRef.current;
    if (!v || typeof v.pause !== "function") return;
    v.pause();
    try {
      v.currentTime = 0;
    } catch (e) {}
  }, [smallBoxVisible, isTheHeroScrolledOut]);

  // Add this useEffect to handle tab visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Browser tab is hidden or minimized
        if (!hasTheUserMuted && isAudioEnabled) {
          // Store that we're muting because of visibility change
          setMutedByVisibilityChange(true);
          // Instantly mute the video
          if (currentVideoRef.current) {
            currentVideoRef.current.muted = true;
          }
        }
      } else {
        // Browser tab is visible again
        if (mutedByVisibilityChange && !hasTheUserMuted) {
          // Reset our flag
          setMutedByVisibilityChange(false);

          // Unmute only if it was muted by visibility change
          if (currentVideoRef.current && didTheUserInteracted) {
            currentVideoRef.current.muted = false;
            currentVideoRef.current.volume = volume;
            setIsAudioEnabled(true);
          }
        }
      }
    };

    // Add and remove event listener
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [
    hasTheUserMuted,
    isAudioEnabled,
    mutedByVisibilityChange,
    didTheUserInteracted,
    volume,
  ]);

  return (
    <div
      id="hero"
      className="relative h-dvh w-screen overflow-x-hidden"
      onMouseEnter={() => setIsTheCurrentVideoHovered(true)}
      onMouseLeave={() => setIsTheCurrentVideoHovered(false)}
    >
      <div
        className={`flex-center absolute z-[100] h-dvh w-screen overflow-hidden bg-white-50 ${
          heroLoading ? "opacity-100" : "opacity-0"
        } transition-opacity duration-300 ease-in-out ${
          loaderVisible ? "" : "invisible"
        }`}
      >
        <div className="three-body">
          <div className="three-body__dot"></div>
          <div className="three-body__dot"></div>
          <div className="three-body__dot"></div>
        </div>
      </div>
      <div
        id="video-frame"
        className={`relative z-10 h-dvh w-screen overflow-hidden rounded-lg  perspective-wrapper ${
          isItZoomingNewVideo ? "bg-[#000]" : "bg-white-75"
        }`}
      >
        <div>
          <div
            ref={smallBoxRef}
            className={`absolute z-100 ${
              isTouchDevice
                ? "size-24 touch-mini-video-box"
                : "size-32 sm:size-64"
            } cursor-pointer rounded-lg overflow-hidden`}
            id="mini-video-box"
            style={{
              perspective: "1000px",
              transformStyle: "preserve-3d",
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: `translate(-50%, -50%)`,
              opacity: isTouchDevice
                ? isTheHeroScrolledOut
                  ? 0
                  : isSmallBoxHovered
                  ? 1
                  : 0.9
                : smallBoxVisible
                ? 1
                : 0,

              transition: smallBoxVisible
                ? `opacity 500ms ease-out`
                : `opacity 0ms ease-out`,
              pointerEvents: isTouchDevice || smallBoxVisible ? "auto" : "none",
              boxShadow: showShadow ? "0 20px 50px rgba(0,0,0,0.4)" : "none",
              border: showShadow ? "1px solid rgba(255,255,255,0.2)" : "none",
            }}
            onClick={handleMiniVideoClick}
            onMouseEnter={() => setIsSmallBoxHovered(true)}
            onMouseLeave={() => setIsSmallBoxHovered(false)}
          >
            <img
              ref={smallBoxInnerRef}
              src={getPosterSrc((currentVideoIndexDelayed % totalVideos) + 1)}
              alt="next preview"
              className="size-full origin-center object-cover object-center select-none"
              draggable={false}
            />
          </div>
          {previousFrameSrc && (
            <img
              ref={previousFrameImgRef}
              src={previousFrameSrc}
              alt="previous frame"
              className="absolute left-0 top-0 size-full object-cover object-center z-5"
              aria-hidden
            />
          )}
          <video
            ref={currentVideoRef}
            src={getVideoSrc(currentVideoIndexDelayed)}
            autoPlay
            loop
            id="current-video-main"
            muted={!isAudioEnabled}
            playsInline
            preload="auto"
            className="absolute left-0 top-0 size-full object-cover object-center z-10"
            onLoadedData={() => {
              const src = getVideoSrc(currentVideoIndexDelayed);
              loadedHeroVideosRef.current.add(src);
              setHeroLoading(false);
            }}
            onError={(e) => {
              console.warn(
                "Errore caricamento video principale",
                e.currentTarget?.src
              );
              setHeroLoading(false);
            }}
          ></video>
          <video
            ref={previousVideoRef}
            src={getVideoSrc(
              currentVideoIndex === 1 ? 3 : currentVideoIndex - 1
            )}
            id="previous-video"
            muted
            playsInline
            preload="none"
            className="absolute left-0 top-0 size-full object-cover object-center z-0"
            onLoadedData={() => {
              // non influisce sul loader principale
            }}
            onError={(e) => {
              console.warn(
                "Errore caricamento video precedente",
                e.currentTarget?.src
              );
            }}
          ></video>
        </div>
        <h1 className="special-font hero-heading absolute bottom-5 right-5 z-40 text-white-75">
          G<b>a</b>ming
        </h1>
        <div className="absolute left-0 top-0 z-40 size-full">
          <div className="mt-24 px-5 sm:px-10 max-w-fit">
            <img
              src="./images/lol-text.webp"
              alt="lol text"
              className="inline-block w-48 sm:w-64 md:w-80 lg:w-96 xl:w-128 2xl:w-144 my-8"
            />
            <p className="mb-5 max-w-48 font-family-robert-regular text-white-100 text-lg md:text-xl sm:max-w-64 md:max-w-80 lg:max-w-96 xl:max-w-128 2xl:max-w-144 flex flex-col items-start gap-3">
              <span>Explore the world of League of Legends</span>
              <span className="text-white-75">Enter The Summoners Rift</span>
            </p>
            <a
              className="inline-block rounded-full"
              href={YTLinks[currentVideoIndex - 1]}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                id="watch-cinematic"
                title="Watch Cinematic"
                leftIcon={<TiLocationArrow />}
                containerClass="bg-league-of-legends-gold-400 hover:bg-league-of-legends-gold-400/80 flex-center gap-1"
              />
            </a>
          </div>
        </div>
        <div className="absolute bottom-5 left-5 z-40 flex-center gap-2 flex-col">
          <div className="slider-container h-28 flex items-center justify-center">
            <input
              type="range"
              min="0"
              max="100"
              value={volume * 100}
              onChange={handleVolumeChange}
              className="volume-slider-vertical"
              style={{
                opacity:
                  !isTheHeroScrolledOut &&
                  isAudioEnabled &&
                  didTheUserInteracted
                    ? 1
                    : 0,
                transition: "opacity 0.3s ease-in-out",
              }}
            />
          </div>
          <div
            onClick={handleAudioClick}
            className={`volume-icon flex-center size-10 rounded-full p-2 ${
              isTheHeroScrolledOut
                ? "bg-gray-500"
                : "bg-league-of-legends-green-400 cursor-pointer"
            }`}
          >
            {isAudioEnabled && !isVolumeZero ? (
              <FaVolumeHigh color="white" />
            ) : (
              <FaVolumeMute color="white" />
            )}
          </div>
        </div>
      </div>
      <h1 className="special-font hero-heading absolute bottom-5 right-5 z-0 text-black">
        G<b>a</b>ming
      </h1>
      <div className="absolute bottom-5 left-5 z-0 flex-center gap-2 flex-col">
        <div className="slider-container h-28 flex items-center justify-center">
          <input
            type="range"
            min="0"
            max="100"
            value={volume * 100}
            onChange={handleVolumeChange}
            className="volume-slider-vertical"
            style={{
              opacity:
                !isTheHeroScrolledOut && isAudioEnabled && didTheUserInteracted
                  ? 1
                  : 0,
              transition: "opacity 0.3s ease-in-out",
            }}
          />
        </div>
        <div
          onClick={handleAudioClick}
          className={`volume-icon flex-center size-10 rounded-full p-2 ${
            isTheHeroScrolledOut
              ? "bg-black"
              : "bg-league-of-legends-green-400 cursor-pointer"
          }`}
        >
          {isAudioEnabled ? (
            <FaVolumeHigh color="white" />
          ) : (
            <FaVolumeMute color="white" />
          )}
        </div>
      </div>
    </div>
  );
};

export default Hero;

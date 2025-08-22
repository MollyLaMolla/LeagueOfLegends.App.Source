import React, { useEffect, useRef } from "react";

/**
 * LazyVideo
 * - Ensures mobile autoplay by setting muted + playsInline (and webkit-playsinline)
 * - Allows preload control (metadata/none/auto)
 * - Optional lazy loading: source is only attached when in viewport (IntersectionObserver)
 */
const LazyVideo = ({
  src,
  className,
  autoPlay = true,
  loop = true,
  muted = true,
  playsInline = true,
  preload = "metadata",
  lazy = true,
  poster,
  onLoadedData,
  ...rest
}) => {
  const videoRef = useRef(null);
  const hasLoadedRef = useRef(false);
  const registrationRef = useRef(null); // placeholder (non più usato)

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Ensure iOS inline playback
    if (playsInline) {
      video.setAttribute("playsinline", "");
      video.setAttribute("webkit-playsinline", "");
    }

    // If not lazy, attach src immediately
    if (!lazy) {
      if (video.src !== src) video.src = src;
      return;
    }

    // Lazy: observe visibility
    const io =
      "IntersectionObserver" in window
        ? new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                if (entry.isIntersecting && !hasLoadedRef.current) {
                  hasLoadedRef.current = true;
                  video.src = src;
                  // if autoplay is requested, try to play
                  const p = video.play?.();
                  if (p && typeof p.then === "function") {
                    p.catch(() => {
                      /* ignore autoplay block; user gesture will play later */
                    });
                  }
                  io.disconnect();
                }
              });
            },
            { rootMargin: "200px 0px", threshold: 0.1 }
          )
        : null;

    if (io) io.observe(video);
    else {
      // Fallback: immediately set src
      if (video.src !== src) video.src = src;
    }

    return () => {
      if (io) io.disconnect();
    };
  }, [src, lazy, playsInline]);

  return (
    <video
      ref={videoRef}
      className={className}
      autoPlay={autoPlay}
      loop={loop}
      muted={muted}
      playsInline={playsInline}
      preload={preload}
      poster={poster}
      disablePictureInPicture
      onLoadedData={onLoadedData}
      onError={(e) => {
        console.warn("Video failed to load:", src);
        // Lasciamo al componente padre decidere se nascondere loader
      }}
      {...rest}
    />
  );
};

export default LazyVideo;

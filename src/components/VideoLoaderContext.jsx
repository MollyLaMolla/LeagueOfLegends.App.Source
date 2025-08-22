import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

/**
 * VideoLoaderContext
 * - Traccia quanti video si registrano e quanti hanno finito (loaded o failed)
 * - Espone un overlay globale di loading finché tutti non sono pronti oppure scatta un timeout
 * - Evita blocchi infiniti se qualche video fallisce (onError) o impiega troppo (timeout)
 */
const VideoLoaderContext = createContext(null);

export const useVideoLoader = () => useContext(VideoLoaderContext);

export const VideoLoaderProvider = ({
  children,
  timeoutMs = 8000,
  minimalShowMs = 600,
}) => {
  const [registered, setRegistered] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const firstShowTimeRef = useRef(null);
  const timeoutRef = useRef(null);
  const seenIdsRef = useRef(new Set());

  // Registra un nuovo video e restituisce callbacks da usare in onLoadedData / onError
  const registerVideo = useCallback((id) => {
    // Evita doppi conteggi per lo stesso id/sorgente
    if (id && seenIdsRef.current.has(id)) {
      return { onLoadedData: () => {}, onError: () => {} };
    }
    if (id) seenIdsRef.current.add(id);

    setRegistered((r) => r + 1);
    setOverlayVisible(true);
    if (!firstShowTimeRef.current) firstShowTimeRef.current = performance.now();

    let done = false;
    const markDone = () => {
      if (done) return; // idempotente
      done = true;
      setCompleted((c) => c + 1);
    };
    return {
      onLoadedData: markDone,
      onError: markDone, // errore conta comunque per sbloccare il loader
    };
  }, []);

  // Timeout di sicurezza: dopo timeoutMs chiude comunque
  useEffect(() => {
    if (overlayVisible && !timeoutRef.current) {
      timeoutRef.current = setTimeout(() => {
        setCompleted((c) => Math.max(c, registered));
      }, timeoutMs);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [overlayVisible, registered, timeoutMs]);

  // Quando tutti completano, aspetta che sia passato minimalShowMs dall'inizio per evitare flash
  useEffect(() => {
    if (registered === 0) return; // niente da fare ancora
    if (completed < registered) return;
    const elapsed = performance.now() - (firstShowTimeRef.current || 0);
    const remaining = Math.max(0, minimalShowMs - elapsed);
    const t = setTimeout(() => {
      setOverlayVisible(false);
    }, remaining);
    return () => clearTimeout(t);
  }, [completed, registered, minimalShowMs]);

  const value = { registerVideo, registered, completed, overlayVisible };

  return (
    <VideoLoaderContext.Provider value={value}>
      {children}
      {overlayVisible && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/85 backdrop-blur-sm transition-opacity">
          <div className="flex flex-col items-center gap-4 text-white">
            <div className="three-body">
              <div className="three-body__dot" />
              <div className="three-body__dot" />
              <div className="three-body__dot" />
            </div>
            <p className="font-family-circular-web text-sm tracking-wide opacity-75">
              Caricamento media {completed}/{registered}
            </p>
          </div>
        </div>
      )}
    </VideoLoaderContext.Provider>
  );
};

/**
 * Hook opzionale per registrare manualmente un <video> non gestito da <LazyVideo />
 */
export const useManualVideoRegistration = (enable = true, id) => {
  const ctx = useVideoLoader();
  const handlersRef = useRef(null);
  useEffect(() => {
    if (!ctx || !enable) return;
    handlersRef.current = ctx.registerVideo(id);
  }, [ctx, enable, id]);
  return handlersRef.current || { onLoadedData: () => {}, onError: () => {} };
};

export default VideoLoaderContext;

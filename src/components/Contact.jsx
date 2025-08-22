import { useState, useEffect, useRef } from "react";
import Button from "./Button";

const ImageClipPath = ({ src, clipClass, clipStyle }) => {
  return (
    <div className={clipClass} style={clipStyle}>
      <img src={src} alt="Clip" />
    </div>
  );
};

const DynamicImageClipBox = ({
  src,
  clipClass,
  clipStyle,
  sensitivity = 0.05,
}) => {
  const [dynamicClipPath, setDynamicClipPath] = useState("");
  const elementRef = useRef(null);
  const frameRef = useRef();
  const mousePosRef = useRef({ x: 0, y: 0 });
  const clipStyleRef = useRef(clipStyle);
  const isProgrammaticScrollRef = useRef(false);

  // Update clipStyleRef when clipStyle changes
  useEffect(() => {
    clipStyleRef.current = clipStyle;
  }, [clipStyle]);

  // Store updateClipPath in a ref to avoid recreation on renders
  const updateClipPathRef = useRef(() => {
    if (!clipStyleRef.current?.clipPath || !elementRef.current) {
      frameRef.current = null;
      return;
    }

    try {
      // Extract the polygon points
      const polygonMatch =
        clipStyleRef.current.clipPath.match(/polygon\(([^)]+)\)/);
      if (!polygonMatch) {
        frameRef.current = null;
        return;
      }

      const points = polygonMatch[1].split(",").map((point) => {
        const [x, y] = point.trim().split(" ");
        return {
          x: parseFloat(x),
          y: parseFloat(y),
        };
      });

      // Get element position for relative calculations
      const rect = elementRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Calculate the direction from center to mouse
      const mousePos = mousePosRef.current;
      const dirX = mousePos.x - centerX;
      const dirY = mousePos.y - centerY;
      const distance = Math.sqrt(dirX * dirX + dirY * dirY);

      // Normalize direction
      const normDirX = distance > 0 ? dirX / distance : 0;
      const normDirY = distance > 0 ? dirY / distance : 0;

      // Adjust each point slightly toward the mouse
      const newPointsStr = points
        .map((point) => {
          // Points closer to mouse edge get moved more
          const pointDistFromCenter = Math.sqrt(
            Math.pow((point.x - 50) / 50, 2) + Math.pow((point.y - 50) / 50, 2)
          );

          const distanceFactor = Math.max(0, 1 - pointDistFromCenter);
          // Increased movement amount
          const moveAmount = sensitivity * distanceFactor * 100;

          const newX = point.x + normDirX * moveAmount;
          const newY = point.y + normDirY * moveAmount;

          return `${newX}% ${newY}%`;
        })
        .join(", ");

      setDynamicClipPath(`polygon(${newPointsStr})`);
    } catch (error) {
      console.error("Error updating clip path:", error);
    }

    // Schedule next frame
    frameRef.current = requestAnimationFrame(updateClipPathRef.current);
  });

  // Track mouse position without causing re-rendersI
  useEffect(() => {
    const updateMousePosition = (e) => {
      // Store mouse position in ref instead of state to avoid re-renders
      mousePosRef.current = {
        x: e.clientX,
        y: e.clientY,
      };

      // Only schedule animation if we have a clip path to animate and not already running
      // and only if there is no programmatic scroll active
      if (
        !isProgrammaticScrollRef.current &&
        clipStyleRef.current?.clipPath &&
        !frameRef.current
      ) {
        frameRef.current = requestAnimationFrame(updateClipPathRef.current);
      }
    };

    const handleSmoothScrollStart = () => {
      isProgrammaticScrollRef.current = true;
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };

    const handleSmoothScrollEnd = () => {
      isProgrammaticScrollRef.current = false;
      // restart frame loop if mouse is present
      if (clipStyleRef.current?.clipPath && !frameRef.current) {
        frameRef.current = requestAnimationFrame(updateClipPathRef.current);
      }
    };

    window.addEventListener("mousemove", updateMousePosition);
    window.addEventListener("smoothScrollStart", handleSmoothScrollStart);
    window.addEventListener("smoothScrollEnd", handleSmoothScrollEnd);

    // Start animation on mount if we have a clip path
    if (clipStyleRef.current?.clipPath) {
      frameRef.current = requestAnimationFrame(updateClipPathRef.current);
    }

    return () => {
      window.removeEventListener("mousemove", updateMousePosition);
      window.removeEventListener("smoothScrollStart", handleSmoothScrollStart);
      window.removeEventListener("smoothScrollEnd", handleSmoothScrollEnd);
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, []);

  // Initialize clip path
  useEffect(() => {
    if (clipStyle?.clipPath) {
      setDynamicClipPath(clipStyle.clipPath);
    }
  }, [clipStyle?.clipPath]);

  return (
    <div
      ref={elementRef}
      className={clipClass}
      style={{
        ...clipStyle,
        clipPath: dynamicClipPath || clipStyle?.clipPath,
        // Remove transition to make movement immediate
      }}
    >
      <img src={src} alt="contact" className="w-full h-full object-cover" />
    </div>
  );
};

const Contact = () => {
  const isTouchDevice = useRef(
    "ontouchstart" in window || navigator.maxTouchPoints > 0
  );

  const handleContactClick = () => {
    window.open(
      "https://support-leagueoflegends.riotgames.com/hc/en-us/",
      "_blank"
    );
  };

  return (
    <div id="contact" className="my-20 min-h-96 w-screen px-10">
      <div className="relative rounded-lg bg-black py-32 text-white-50">
        <div className="contact-left-img-container">
          <DynamicImageClipBox
            src="./images/contact-1.webp"
            clipClass="contact-img-1"
            clipStyle={{ clipPath: "polygon(25% 0%, 74% 0, 69% 64%, 34% 73%)" }}
            sensitivity={0.05} // Increased sensitivity
          />
          <DynamicImageClipBox
            src="./images/contact-2.webp"
            clipClass="contact-img-2"
            clipStyle={{
              clipPath: "polygon(29% 15%, 85% 30%, 50% 100%, 10% 64%)",
            }}
            sensitivity={0.05} // Increased sensitivity
          />
        </div>
        {/* Make sure to add specific size and position to ahri container */}
        <div className="ahri-card relative">
          <ImageClipPath
            src="./images/ahri-cut.webp"
            clipClass="absolute scale-100"
          />
          <ImageClipPath
            src="./images/ahri.webp"
            clipClass="scale-100"
            clipStyle={{
              clipPath: "polygon(16% 0, 89% 15%, 75% 100%, 0 97%)",
            }}
          />
        </div>
        <div className="flex flex-col items-center text-center">
          <p className="font-family-general text-[10px] uppercase">
            Join League of Legends
          </p>
          <p className="special-contact-font mt-4 w-full font-family-zentry leading-[0.9] lg:mt-10 contact-title">
            L<b>e</b>t's b<b>u</b>id t<b>h</b>e <br /> ul<b>t</b>ima<b>t</b>e ga
            <b>m</b>ing <br /> e<b>x</b>perience together.
          </p>
          <a
            href={
              isTouchDevice.current
                ? "https://support-leagueoflegends.riotgames.com/hc/en-us/"
                : undefined
            }
            onClick={isTouchDevice.current ? undefined : handleContactClick}
            className="mt-10 rounded-full"
          >
            <Button
              title="Contact Us"
              containerClass="cursor-pointer bg-league-of-legends-gold-400 hover:bg-league-of-legends-gold-400/80"
            />
          </a>
        </div>
      </div>
    </div>
  );
};

export default Contact;

import { useEffect, useRef } from "react";
import gsap from "gsap";

const AnimatedTitle = ({ title, containerClass }) => {
  const constainerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Animation logic here
      const titleAnimation = gsap.timeline({
        scrollTrigger: {
          trigger: constainerRef.current,
          start: "100 bottom",
          end: "center bottom",
          toggleActions: "play none none reverse",
        },
      });
      titleAnimation.to(".animated-word", {
        opacity: 1,
        transform: "translate3d(0, 0, 0) rotateY(0deg) rotateX(0deg)",
        ease: "power2.inOut",
        stagger: 0.02,
      });
    }, constainerRef);
    return () => {
      ctx.revert(); // Clean up the GSAP context
    };
  }, []);
  return (
    <div ref={constainerRef} className={`animated-title ${containerClass}`}>
      {title.split("<br />").map((line, index) => (
        <div
          key={index}
          className="flex-center max-w-full flex-wrap gap-2 px-10 md:gap-3"
        >
          {line.split(" ").map((word, wordIndex) => (
            <span
              key={wordIndex}
              className="animated-word"
              dangerouslySetInnerHTML={{ __html: word }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default AnimatedTitle;

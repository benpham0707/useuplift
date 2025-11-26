import { motion, useScroll, useTransform, useMotionTemplate } from 'motion/react';
import { useRef } from 'react';

const logos = [
  { name: 'Stanford', src: '/uni_logos/stanford_transparent.png', scale: 1 },
  { name: 'MIT', src: '/uni_logos/MITtransparent.png', scale: 1 },
  { name: 'Columbia', src: '/uni_logos/columbiatransparent.png', scale: 1.3 },
  { name: 'UPenn', src: '/uni_logos/upenntransparent.png', scale: 1.3 },
  { name: 'UC Berkeley', src: '/uni_logos/ucberkeleytransparent.png', scale: 1 },
  { name: 'UCLA', src: '/uni_logos/ucla_transparent.png', scale: 0.85 },
  { name: 'UC San Diego', src: '/uni_logos/ucsdtransparent.png', scale: 1.4 },
  { name: 'UCI', src: '/uni_logos/ucitransparent.png', scale: 1 },
];

const UniversityBacked = () => {
  const containerRef = useRef(null);
  
  // Track scroll progress relative to this component
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 90%", "center center"] 
  });

  // Map scroll progress to grayscale (100% -> 0%) and opacity (0.3 -> 1)
  // As it scrolls into view (start 90%), it starts lighting up.
  // By the time it hits the center (center center), it's fully colored.
  const grayscaleValue = useTransform(scrollYProgress, [0, 1], [100, 0]);
  const opacityValue = useTransform(scrollYProgress, [0, 1], [0.3, 1]);
  
  const filterStyle = useMotionTemplate`grayscale(${grayscaleValue}%)`;

  return (
    <section ref={containerRef} className="py-8 border-y bg-slate-50/50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 text-center">
        <p className="text-sm font-medium text-muted-foreground">
          Backed by professionals from
        </p>
      </div>

      <div className="relative flex overflow-hidden group">
        {/* Gradient Masks */}
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-slate-50 to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-slate-50 to-transparent z-10" />

        {/* Scrolling Container - Using CSS animation for smooth infinite scroll */}
        <div 
          className="flex gap-12 md:gap-20 items-center animate-scroll"
          style={{
            animation: 'scroll 40s linear infinite',
          }}
        >
          {[...logos, ...logos].map((logo, index) => (
            <motion.div
              key={`${logo.name}-${index}`}
              style={{ 
                filter: filterStyle,
                opacity: opacityValue
              }}
              className="flex-shrink-0 h-16 md:h-20 flex items-center justify-center"
            >
              <img
                src={logo.src}
                alt={`${logo.name} logo`}
                className="max-h-full w-auto object-contain"
                style={{ transform: `scale(${logo.scale})` }}
              />
            </motion.div>
          ))}
        </div>

        {/* CSS Keyframes for smooth infinite scroll */}
        <style>{`
          @keyframes scroll {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(-50%);
            }
          }
        `}</style>
      </div>
    </section>
  );
};

export default UniversityBacked;

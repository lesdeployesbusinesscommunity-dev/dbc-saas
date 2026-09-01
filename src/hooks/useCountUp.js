// Import Dependencies
import { useEffect, useRef, useState } from "react";

// ----------------------------------------------------------------------

// Anime un nombre de 0 jusqu'à "target" pendant "duration" ms, seulement
// quand "start" devient true (ex: quand la section devient visible à
// l'écran, via useInView). Utilisé pour les chiffres de la section
// Statistiques.
export function useCountUp(target, { duration = 1500, start = true } = {}) {
  const [value, setValue] = useState(0);
  const frameRef = useRef(null);

  useEffect(() => {
    if (!start) return undefined;

    const startTime = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      // easeOutCubic : l'animation démarre vite puis ralentit en douceur
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      }
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [start, target, duration]);

  return value;
}

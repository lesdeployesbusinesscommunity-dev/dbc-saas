// Import Dependencies
import { useEffect, useRef, useState } from "react";

// ----------------------------------------------------------------------

// Détecte quand un élément entre (et sort) de la zone visible de l'écran.
// Sert à déclencher les animations d'apparition au scroll.
//
// Par défaut (once: false) l'état repasse à "false" quand l'élément sort
// de l'écran, donc l'animation se rejoue à chaque fois qu'on scrolle
// jusqu'à lui (pas seulement la première fois). Passer once: true pour
// l'ancien comportement (une seule apparition, jamais rejouée).
//
// Usage : const [ref, isInView] = useInView();  puis <div ref={ref}>...
export function useInView({ threshold = 0.2, rootMargin = "0px", once = false } = {}) {
  const ref = useRef(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setIsInView(false);
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [once, threshold, rootMargin]);

  return [ref, isInView];
}

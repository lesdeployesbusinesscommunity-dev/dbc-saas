// Import Dependencies
import PropTypes from "prop-types";
import clsx from "clsx";

// ----------------------------------------------------------------------

// Petit composant réutilisable pour faire apparaître un titre, un
// paragraphe ou tout autre bloc en fondu + glissement, avec un délai
// donné. Utilisé pour faire arriver le contenu d'une section
// progressivement : titre d'abord, puis sous-titre, puis texte, etc.
//
// "show" vient d'un useInView() posé sur la section parente : quand la
// section sort de l'écran, "show" redevient false et l'élément se
// remettra à zéro pour la prochaine apparition.
export function Reveal({
  show,
  delay = 0,
  duration = 800,
  as: Tag = "div",
  className,
  children,
}) {
  return (
    <Tag
      className={clsx(
        "transition-all ease-out",
        show ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0",
        className,
      )}
      style={{ transitionDuration: `${duration}ms`, transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}

Reveal.propTypes = {
  show: PropTypes.bool.isRequired,
  delay: PropTypes.number,
  duration: PropTypes.number,
  as: PropTypes.elementType,
  className: PropTypes.string,
  children: PropTypes.node,
};

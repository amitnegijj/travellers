import { useEffect } from "react";

/**
 * Marks the document while a full-bleed photo surface is mounted.
 *
 * Two things have to change and neither belongs to the page: the app chrome
 * goes dark glass so a white header does not sit on top of black photography,
 * and the document stops scrolling so the only scroller is the trail pager.
 * Both are one CSS rule each, keyed off body[data-immersive] in index.css.
 */
export function ImmersiveMode() {
  useEffect(() => {
    document.body.dataset.immersive = "true";
    return () => {
      delete document.body.dataset.immersive;
    };
  }, []);

  return null;
}

import { useEffect } from "react";

let lockDepth = 0;
let savedBodyOverflow = "";

/**
 * Reference-counted body scroll lock so multiple stacked modals work.
 */
export function useModalBodyLock(active) {
  useEffect(() => {
    if (!active) return;
    lockDepth += 1;
    if (lockDepth === 1) {
      savedBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    return () => {
      lockDepth -= 1;
      if (lockDepth <= 0) {
        lockDepth = 0;
        document.body.style.overflow = savedBodyOverflow;
      }
    };
  }, [active]);
}

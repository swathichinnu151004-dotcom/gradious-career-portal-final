import { createPortal } from "react-dom";
import { useModalBodyLock } from "./modalScrollLock";

/**
 * Renders children into document.body so overlays sit above the layout topbar
 * (main content uses a low stacking context).
 *
 * @param {boolean} open
 * @param {import("react").ReactNode} children
 * @param {boolean} [lockBodyScroll=true] — set false for toasts / non-blocking UI
 */
export default function ModalPortal({ open, children, lockBodyScroll = true }) {
  useModalBodyLock(Boolean(open) && lockBodyScroll);

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(children, document.body);
}

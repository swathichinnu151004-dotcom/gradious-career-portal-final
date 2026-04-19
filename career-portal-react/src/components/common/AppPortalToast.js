import ModalPortal from "./ModalPortal";
import "./AppPortalToast.css";

/**
 * Small status toast portaled to document.body (top-right).
 * Uses isolated class names so page styles cannot stretch or restyle it.
 *
 * @param {object} props
 * @param {boolean} props.open
 * @param {string} props.message
 * @param {"success" | "error"} [props.variant]
 */
export default function AppPortalToast({ open, message, variant = "success" }) {
  const v = variant === "error" ? "error" : "success";
  const text = (message || "").trim();
  const visible = Boolean(open && text);

  return (
    <ModalPortal open={visible} lockBodyScroll={false}>
      {visible ? (
        <div role="status" className={`app-portal-toast app-portal-toast--${v}`}>
          {text}
        </div>
      ) : null}
    </ModalPortal>
  );
}

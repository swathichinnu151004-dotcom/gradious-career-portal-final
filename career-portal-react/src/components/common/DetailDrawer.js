import ModalPortal from "./ModalPortal";
import "./DetailDrawer.css";

/**
 * Right-side detail panel (same interaction pattern as Admin → Manage Recruiters).
 * Uses ModalPortal so it stacks above the dashboard top bar.
 */
export function DetailDrawerField({ label, children, full }) {
  return (
    <div
      className={`detail-drawer-card${full ? " detail-drawer-card--full" : ""}`}
    >
      {label ? (
        <span className="detail-drawer-card-label">{label}</span>
      ) : null}
      {typeof children === "string" || typeof children === "number" ? (
        <p className="detail-drawer-card-value">{children}</p>
      ) : (
        children
      )}
    </div>
  );
}

export default function DetailDrawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  titleId = "detail-drawer-heading",
  /** "md" = 420px (default), "lg" = 480px for wider job views */
  size = "md",
}) {
  const panelClass =
    size === "lg"
      ? "detail-drawer-panel detail-drawer-panel--lg"
      : "detail-drawer-panel";

  return (
    <ModalPortal open={open}>
      {open ? (
        <div
          className="detail-drawer-overlay"
          onClick={onClose}
          role="presentation"
        >
          <aside
            className={panelClass}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onClick={(e) => e.stopPropagation()}
          >
            <header className="detail-drawer-header">
              <div className="detail-drawer-header-text">
                <h3 id={titleId}>{title}</h3>
                {subtitle ? (
                  <p className="detail-drawer-subtitle">{subtitle}</p>
                ) : null}
              </div>
              <button
                type="button"
                className="detail-drawer-close"
                onClick={onClose}
                aria-label="Close"
              >
                ✕
              </button>
            </header>
            <div className="detail-drawer-body">{children}</div>
          </aside>
        </div>
      ) : null}
    </ModalPortal>
  );
}

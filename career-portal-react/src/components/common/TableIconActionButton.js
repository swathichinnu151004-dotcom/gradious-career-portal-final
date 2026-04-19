import {
  Eye,
  Pencil,
  Trash2,
  Ban,
  Unlock,
  UserCheck,
  XCircle,
} from "lucide-react";
import "./TableIconActionButton.css";

const VARIANTS = {
  view: { Icon: Eye, defaultTooltip: "View details" },
  update: { Icon: Pencil, defaultTooltip: "Update" },
  delete: { Icon: Trash2, defaultTooltip: "Delete" },
  block: { Icon: Ban, defaultTooltip: "Block" },
  unblock: { Icon: Unlock, defaultTooltip: "Unblock" },
  shortlist: { Icon: UserCheck, defaultTooltip: "Shortlist" },
  reject: { Icon: XCircle, defaultTooltip: "Reject" },
};

/**
 * Icon-only row action with native hover tooltip (`title` / `aria-label`).
 */
export default function TableIconActionButton({
  variant,
  onClick,
  disabled = false,
  tooltip,
  className = "",
}) {
  const meta = VARIANTS[variant];
  if (!meta) return null;
  const { Icon, defaultTooltip } = meta;
  const tip = tooltip || defaultTooltip;

  return (
    <button
      type="button"
      className={`table-icon-action table-icon-action--${variant} ${className}`.trim()}
      onClick={onClick}
      disabled={disabled}
      title={tip}
      aria-label={tip}
    >
      <Icon size={18} strokeWidth={2.25} />
    </button>
  );
}

/** Flex row for table action buttons */
export function TableIconActions({ children, className = "" }) {
  return (
    <div className={`table-icon-actions ${className}`.trim()}>{children}</div>
  );
}

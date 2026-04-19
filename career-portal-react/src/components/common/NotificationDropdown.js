import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, BellRing, X } from "lucide-react";
import {
  fetchNotifications,
  fetchUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
  deleteNotification,
} from "../../services/notificationService";
import "./NotificationDropdown.css";

function formatTimeAgo(dateInput) {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return "";

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingList, setLoadingList] = useState(false);
  const [error, setError] = useState("");
  const [markingAll, setMarkingAll] = useState(false);
  const [dismissingIds, setDismissingIds] = useState(() => new Set());
  const wrapRef = useRef(null);
  const itemsRef = useRef([]);
  itemsRef.current = items;

  const loadUnread = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const { data } = await fetchUnreadNotificationCount();
      const raw = data?.unreadCount ?? data?.count ?? 0;
      const n = typeof raw === "bigint" ? Number(raw) : Number(raw);
      setUnreadCount(Number.isFinite(n) ? n : 0);
    } catch (e) {
      if (e?.response?.status === 401) {
        setUnreadCount(0);
      }
    }
  }, []);

  const loadList = useCallback(async ({ showSpinner = true } = {}) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    if (showSpinner) setLoadingList(true);
    setError("");
    try {
      const { data } = await fetchNotifications({ limit: 40, unreadOnly: 1 });
      const list = Array.isArray(data?.notifications)
        ? data.notifications
        : Array.isArray(data)
        ? data
        : [];
      setItems(list);
    } catch (e) {
      const st = e?.response?.status;
      setError(
        st === 401
          ? "Session expired. Please log in again."
          : e?.response?.data?.message ||
              "Could not load notifications. Check that the API is running."
      );
    } finally {
      if (showSpinner) setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    loadUnread();
    const POLL_MS = 15000;
    const id = setInterval(loadUnread, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") loadUnread();
    };
    const onFocus = () => loadUnread();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
    };
  }, [loadUnread]);

  useEffect(() => {
    if (!open) return;
    const showSpinner = itemsRef.current.length === 0;
    loadList({ showSpinner });
    loadUnread();
  }, [open, loadList, loadUnread]);

  useEffect(() => {
    const onRefresh = () => {
      loadUnread();
      loadList({ showSpinner: false });
    };
    window.addEventListener("career-portal:notifications-refresh", onRefresh);
    return () =>
      window.removeEventListener(
        "career-portal:notifications-refresh",
        onRefresh
      );
  }, [loadUnread, loadList]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e) => {
      if (wrapRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () =>
      document.removeEventListener("pointerdown", onPointerDown, true);
  }, [open]);

  const toggle = () => setOpen((v) => !v);

  const onItemClick = async (n) => {
    if (n.isRead || !n.id) return;
    setError("");
    try {
      await markNotificationRead(n.id);
      setItems((prev) => prev.filter((x) => x.id !== n.id));
      await loadUnread();
    } catch {
      setError("Could not mark as read. Try again.");
    }
  };

  const onMarkAll = async () => {
    setMarkingAll(true);
    setError("");
    try {
      await markAllNotificationsRead();
      setItems([]);
      await loadUnread();
    } catch {
      setError("Could not mark all as read.");
    } finally {
      setMarkingAll(false);
    }
  };

  const onDismissItem = async (e, n) => {
    e.preventDefault();
    e.stopPropagation();
    if (!n?.id || dismissingIds.has(n.id)) return;
    setDismissingIds((prev) => new Set(prev).add(n.id));
    setError("");
    try {
      await deleteNotification(n.id);
      setItems((prev) => prev.filter((x) => x.id !== n.id));
      await loadUnread();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Could not remove that notification."
      );
    } finally {
      setDismissingIds((prev) => {
        const next = new Set(prev);
        next.delete(n.id);
        return next;
      });
    }
  };

  const token = localStorage.getItem("token");
  if (!token) {
    return null;
  }

  return (
    <div className="notification-wrap" ref={wrapRef}>
      <button
        type="button"
        className={`dashboard-bell-btn notification-bell-btn ${
          open ? "open" : ""
        } ${unreadCount > 0 ? "has-unread" : ""}`}
        onClick={toggle}
        aria-expanded={open}
        aria-label="Notifications"
        title="Notifications"
      >
        <span className="notification-bell-glow" aria-hidden />
        <span className="notification-bell-icon-wrap">
          {unreadCount > 0 ? (
            <BellRing
              size={21}
              strokeWidth={2}
              className="notification-bell-svg"
            />
          ) : (
            <Bell size={21} strokeWidth={2} className="notification-bell-svg" />
          )}
        </span>
        <span
          className={`notification-badge ${
            unreadCount > 0 ? "" : "hidden"
          }`}
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      </button>

      {open && (
        <div className="notification-dropdown" role="dialog">
          <div className="notification-dropdown-header">
            <h3>Notifications</h3>
            <button
              type="button"
              className="notification-mark-all"
              onClick={onMarkAll}
              disabled={markingAll || unreadCount === 0}
            >
              Mark all as read
            </button>
          </div>

          {error && (
            <div className="notification-dropdown-error">{error}</div>
          )}

          <div className="notification-dropdown-body" role="list">
            {loadingList ? (
              <div className="notification-dropdown-loading">Loading…</div>
            ) : items.length === 0 ? (
              <div className="notification-empty">No unread notifications</div>
            ) : (
              items.map((n) => (
                <div
                  key={n.id}
                  role="listitem"
                  className={`notification-item ${
                    n.isRead ? "" : "unread"
                  }`}
                >
                  <button
                    type="button"
                    className="notification-item-main"
                    onClick={() => onItemClick(n)}
                  >
                    <p className="notification-item-title">{n.title}</p>
                    <p className="notification-item-message">{n.message}</p>
                    <div className="notification-item-meta">
                      {formatTimeAgo(n.createdAt)}
                    </div>
                  </button>
                  <button
                    type="button"
                    className="notification-item-close"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => onDismissItem(e, n)}
                    disabled={dismissingIds.has(n.id)}
                    aria-label="Dismiss notification"
                    title="Dismiss"
                  >
                    <X size={16} strokeWidth={2.25} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationDropdown;

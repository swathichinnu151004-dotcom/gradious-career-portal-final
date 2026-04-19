/** Tell NotificationDropdown to refetch unread count (and list if needed). */
export function refreshNotificationsInbox() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("career-portal:notifications-refresh"));
}

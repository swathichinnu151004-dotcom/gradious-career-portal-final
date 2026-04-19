import API from "./api";

export function fetchNotifications(params) {
  return API.get("/notifications", { params });
}

export function fetchUnreadNotificationCount() {
  return API.get("/notifications/unread-count");
}

export function markNotificationRead(id) {
  return API.put(`/notifications/${id}/read`);
}

export function markAllNotificationsRead() {
  return API.put("/notifications/mark-all-read");
}

export function deleteNotification(id) {
  return API.delete(`/notifications/${id}`);
}

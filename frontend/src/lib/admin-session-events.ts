export const ADMIN_SESSION_READY_EVENT = "admin:session-ready";

export function emitAdminSessionReady() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(ADMIN_SESSION_READY_EVENT));
}

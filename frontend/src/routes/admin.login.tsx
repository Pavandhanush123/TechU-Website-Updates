import { createFileRoute, Navigate } from "@tanstack/react-router";

// Legacy URL — admin login lives inline at /admin now.
export const Route = createFileRoute("/admin/login")({
  component: () => <Navigate to="/admin" replace />,
});

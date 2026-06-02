import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppShell } from "../components/AppShell";
import { useAuth } from "../lib/auth";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  const { user, profile, profileReady } = useAuth();
  const navigate = useNavigate();

  // Guard: redirect if not authenticated or no org — runs client-side only
  // to avoid SSR/hydration mismatch from beforeLoad
  useEffect(() => {
    if (!profileReady) return;
    if (!user) {
      navigate({ to: "/login" });
    } else if (!profile?.org_id) {
      navigate({ to: "/onboarding" });
    }
  }, [user, profile, profileReady, navigate]);

  // Don't render the shell until we know auth state is settled
  if (!profileReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <AppShell title="">
      <Outlet />
    </AppShell>
  );
}
